# Dusk Index

Sistema local em HTML/CSS/JS para consultar Dusks, bosses e drops do Palácio do Crepúsculo.

## Como usar

Coloque estes arquivos na mesma pasta onde existe a pasta `output` gerada pelo extractor:

```txt
index.html
assets/
data/
scripts/
output/
  images/
  dusk_data.json
```

Depois rode:

```bash
python -m http.server 5500
```

Abra:

```txt
http://localhost:5500
```

Também pode abrir o `index.html` direto, mas o Worker pode ser bloqueado dependendo do navegador. O sistema tem fallback sem Worker.

## Regerar índice

Quando rodar o extractor de novo e atualizar `output/dusk_data.json`, gere novamente os arquivos de dados:

```bash
python scripts/build-dusk-index.py --input output/dusk_data.json --out-dir data
```

Isso recria:

```txt
data/dusk-index.json
data/dusk-index.js
```

## Estrutura de dados

- `dusks`: lista de Dusks 1-1 até 3-3.
- `bosses`: bosses com imagem, capítulo, aliases e drops vinculados.
- `items`: drops indexados com `id`, imagem, boss, Dusk, modo e tabela.
- `equipment.example.json`: modelo para criar a futura página de equipamentos.

Para equipamentos, use o `itemId` do drop. Exemplo:

```json
{
  "id": "arma-exemplo",
  "name": "Arma Exemplo",
  "requiredItems": [
    { "itemId": "simbolo-do-crepusculo", "quantity": 1 }
  ]
}
```
