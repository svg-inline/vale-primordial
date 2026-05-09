#!/usr/bin/env python3
"""Normaliza o output/dusk_data.json em um índice pronto para frontend."""

from __future__ import annotations

import argparse
import difflib
import json
import re
import unicodedata
from pathlib import Path
from typing import Any


def slugify(value: str) -> str:
    value = (value or '').strip().lower()
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^a-z0-9]+', '-', value).strip('-')
    return value or 'sem-nome'


def key(value: str) -> str:
    value = (value or '').strip().lower()
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '', value)


def clean_text(value: Any) -> str:
    return re.sub(r'\s+', ' ', str(value or '').replace('\xa0', ' ')).strip()


def norm_img(path: str) -> str:
    return (path or '').replace('\\', '/').replace('//', '/')


def first_image(row: dict[str, Any]) -> tuple[str, str]:
    images = row.get('_images') or []
    if not images:
        return '', ''
    image = images[0]
    return norm_img(image.get('file', '')), image.get('url', '')


def build_index(raw: dict[str, Any]) -> dict[str, Any]:
    chapter_info = {
        '1': {'id': 'chapter-1', 'name': 'Capítulo 1'},
        '2': {'id': 'chapter-2', 'name': 'Capítulo 2'},
        '3': {'id': 'chapter-3', 'name': 'Capítulo 3'},
    }

    dusks = [
        {'id': '1-1', 'chapter': '1', 'name': 'Inicial', 'level': '60 - 65', 'slug': '1-1-inicial'},
        {'id': '1-2', 'chapter': '1', 'name': 'Defensor', 'level': '68 - 72', 'slug': '1-2-defensor'},
        {'id': '1-3', 'chapter': '1', 'name': 'Valente', 'level': '76 - 81', 'slug': '1-3-valente'},
        {'id': '2-1', 'chapter': '2', 'name': 'Valente', 'level': '74 - 79', 'slug': '2-1-valente'},
        {'id': '2-2', 'chapter': '2', 'name': 'Herói', 'level': '82 - 87', 'slug': '2-2-heroi'},
        {'id': '2-3', 'chapter': '2', 'name': 'Iluminado', 'level': '90 - 95', 'slug': '2-3-iluminado'},
        {'id': '3-1', 'chapter': '3', 'name': 'Iluminado', 'level': '88 - 93', 'slug': '3-1-iluminado'},
        {'id': '3-2', 'chapter': '3', 'name': 'Priest', 'level': '95 - 100', 'slug': '3-2-priest'},
        {'id': '3-3', 'chapter': '3', 'name': 'Saint', 'level': '100+', 'slug': '3-3-saint'},
    ]

    for dusk in dusks:
        dusk['label'] = f"{dusk['id']} {dusk['name']}"
        dusk['items'] = []
        dusk['bosses'] = []

    bosses: list[dict[str, Any]] = []

    for table_index, chapter in [(3, '1'), (4, '2'), (5, '3')]:
        table = raw['tables'][table_index]
        for row in table['rows']:
            name = clean_text(row.get('Nome'))
            if not name:
                continue

            image, _ = first_image(row)
            bosses.append({
                'id': slugify(name),
                'name': name,
                'slug': slugify(name),
                'chapter': chapter,
                'chapterName': chapter_info[chapter]['name'],
                'image': image,
                'quantityOption': clean_text(row.get('Aparece com a opção quantidade de boss')),
                'drops': [],
                'dusks': [],
                'aliases': [],
            })

    boss_by_key = {key(boss['name']): boss for boss in bosses}
    boss_keys = list(boss_by_key.keys())

    def match_boss(source: str) -> dict[str, Any] | None:
        source = clean_text(source)
        if not source or source.lower().startswith('mobs'):
            return None

        source_key = key(source)
        if source_key in boss_by_key:
            return boss_by_key[source_key]

        match = difflib.get_close_matches(source_key, boss_keys, n=1, cutoff=0.74)
        if not match:
            return None

        boss = boss_by_key[match[0]]
        if source not in boss['aliases'] and source != boss['name']:
            boss['aliases'].append(source)
        return boss

    labels = {
        6: 'Drops 6x',
        7: 'Drops 7x',
        8: 'Drops 8x',
        9: 'Drops 9x',
        10: 'Drops 3-2 / 3-3',
        11: 'Drops raros',
    }

    items: list[dict[str, Any]] = []
    sources: list[dict[str, Any]] = []
    source_by_key: dict[str, dict[str, Any]] = {}

    def ensure_source(name: str) -> dict[str, Any] | None:
        name = clean_text(name)
        if not name:
            return None

        source_key = key(name)
        if source_key in source_by_key:
            return source_by_key[source_key]

        source = {
            'id': slugify(name),
            'name': name,
            'type': 'environment' if name.lower().startswith('mobs') else 'unknown',
            'items': [],
            'dusks': [],
        }
        source_by_key[source_key] = source
        sources.append(source)
        return source

    for table_index in range(6, 12):
        table = raw['tables'][table_index]
        for row in table['rows']:
            name = clean_text(row.get('col_2'))
            if not name or name.lower() in {'nome do item', 'materiais'}:
                continue

            dropped_by = clean_text(row.get('col_3'))
            dusk_text = clean_text(row.get('col_4'))
            image, image_url = first_image(row)
            instances = sorted(set(re.findall(r'\b[123]-[123]\b', dusk_text)))

            text_lower = dusk_text.lower()
            modes = []
            if 'solo' in text_lower:
                modes.append('Solo')
            if 'grupo' in text_lower:
                modes.append('Grupo')
            if not modes:
                modes = ['Não informado']

            boss = match_boss(dropped_by)
            source = None if boss else ensure_source(dropped_by)

            item = {
                'id': slugify(name),
                'name': name,
                'slug': slugify(name),
                'image': image,
                'imageUrl': image_url,
                'droppedBy': dropped_by,
                'bossId': boss['id'] if boss else '',
                'bossName': boss['name'] if boss else '',
                'sourceId': source['id'] if source else '',
                'sourceType': 'boss' if boss else ('environment' if source and source['type'] == 'environment' else 'unknown'),
                'dusks': instances,
                'duskText': dusk_text,
                'modes': modes,
                'dropTable': labels.get(table_index, f'Tabela {table_index}'),
                'tableIndex': table_index,
                'searchText': ' '.join([name, dropped_by, dusk_text, labels.get(table_index, '')]).lower(),
            }

            base_id = item['id']
            index = 2
            existing_ids = {existing['id'] for existing in items}
            while item['id'] in existing_ids:
                item['id'] = f'{base_id}-{index}'
                index += 1

            items.append(item)

            if boss:
                boss['drops'].append(item['id'])
                for instance in instances:
                    if instance not in boss['dusks']:
                        boss['dusks'].append(instance)
            elif source:
                source['items'].append(item['id'])
                for instance in instances:
                    if instance not in source['dusks']:
                        source['dusks'].append(instance)

            for instance in instances:
                dusk = next((entry for entry in dusks if entry['id'] == instance), None)
                if not dusk:
                    continue

                dusk['items'].append(item['id'])
                if boss and boss['id'] not in dusk['bosses']:
                    dusk['bosses'].append(boss['id'])

    for boss in bosses:
        boss['dropsCount'] = len(boss['drops'])
        boss['dusks'] = sorted(boss['dusks'])

    for dusk in dusks:
        dusk['itemsCount'] = len(dusk['items'])
        dusk['bossesCount'] = len(dusk['bosses'])

    for source in sources:
        source['itemsCount'] = len(source['items'])
        source['dusks'] = sorted(source['dusks'])

    return {
        'meta': {
            'title': 'Palácio do Crepúsculo / Dusk',
            'source': raw.get('source'),
            'fetchedAt': raw.get('fetched_at'),
            'version': '1.0.0',
            'notes': 'Dados normalizados a partir das tabelas extraídas do guia.',
        },
        'chapters': list(chapter_info.values()),
        'dusks': dusks,
        'bosses': bosses,
        'items': items,
        'sources': sources,
        'indexes': {
            'itemById': {item['id']: item for item in items},
            'bossById': {boss['id']: boss for boss in bosses},
            'duskById': {dusk['id']: dusk for dusk in dusks},
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description='Gera índice normalizado do Dusk.')
    parser.add_argument('--input', default='output/dusk_data.json', help='Caminho do dusk_data.json')
    parser.add_argument('--out-dir', default='data', help='Diretório de saída')
    args = parser.parse_args()

    input_path = Path(args.input)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = json.loads(input_path.read_text(encoding='utf-8'))
    index = build_index(raw)

    json_path = out_dir / 'dusk-index.json'
    js_path = out_dir / 'dusk-index.js'

    json_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
    js_path.write_text('window.DUSK_INDEX = ' + json.dumps(index, ensure_ascii=False) + ';\n', encoding='utf-8')

    print(f'Bosses: {len(index["bosses"])}')
    print(f'Drops: {len(index["items"])}')
    print(f'Dusks: {len(index["dusks"])}')
    print(f'Gerado: {json_path}')
    print(f'Gerado: {js_path}')


if __name__ == '__main__':
    main()
