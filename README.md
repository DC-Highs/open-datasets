# DC Highs Open Datasets

Este projeto é uma coleção de dados extraídos de diversas fontes públicas, como wikis da comunidade, sites informativos criados por fãs e outros recursos disponíveis publicamente. O objetivo é centralizar e organizar esses dados em um formato semelhante ao utilizado internamente pelo Dragon City.

Mas, além disso, um dos principais objetivos desse projeto é testar, validar e aprimorar o framework de web scraping que está sendo desenvolvido pela [Xcrap](https://github.com/xcrap-dev) que tem como desenvolvedor principal o [Marcuth](https://github.com/marcuth).

## 📥 Download dos Datasets (Links Diretos / Raw)

Os arquivos de dados são mantidos atualizados diariamente via GitHub Actions. Você pode acessá-los ou baixá-los diretamente usando os links raw abaixo:

| Fonte | Descrição | Formato | Link Direto (Raw) |
| :--- | :--- | :---: | :--- |
| **Dbgames** | Dados completos dos dragões | `JSON` | [full-data-dragons.json](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dbgames/json/full-data-dragons.json) |
| **Dbgames** | Lista prévia / resumida dos dragões | `JSON` | [preview-dragons.json](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dbgames/json/preview-dragons.json) |
| **Dbgames** | Banco de dados SQLite dos dragões | `SQLite` | [data.sqlite3](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dbgames/data.sqlite3) |
| **Dragon City Game** | Artigos e notícias completos | `JSON` | [full-data-articles.json](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dragoncitygame/json/full-data-articles.json) |
| **Dragon City Game** | Prévia / resumo dos artigos | `JSON` | [preview-articles.json](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dragoncitygame/json/preview-articles.json) |
| **Dragon City Game** | Produtos da loja oficial | `JSON` | [products.json](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dragoncitygame/json/products.json) |
| **Dragon City Game** | Banco de dados SQLite dos artigos | `SQLite` | [data.sqlite3](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/dragoncitygame/data.sqlite3) |
| **SP Translations** | Localização e textos oficiais do jogo (`en`) | `JSON` | [en.json](https://raw.githubusercontent.com/DC-Highs/open-datasets/master/sp-translations/en.json) |

## Fontes que estamos cobrindo até o momento

- [x] Dbgames Dragon City - https://dbgames.info/dragoncity/
- [ ] Dragon City Wiki - https://dragon-city.fandom.com/wiki/Dragon_City_Wiki
- [ ] Deetlist Dragon City - https://deetlist.com/dragoncity/
- [ ] Ditlep - https://ditlep.com/dragoncity/
- [x] Dragon City Game - https://www.dragoncitygame.com/
- [x] Sp-translations

## 🤖 Automação

O projeto utiliza GitHub Actions para manter os dados atualizados automaticamente. Cada fonte possui seu próprio workflow de sincronização:

- **Dbgames**: Sincronização diária dos dados dos dragões.
- **SP Translations**: Sincronização diária dos arquivos de localização (en) da SocialPoint.
- **Dragon City Game**: Sincronização diária dos artigos e produtos da loja oficial.

> Nota: Se estiver rodando localmente, tome cuidado com que vai fazer; não faça requisições desnecessárias aos sites, pois isso pode prejudicar o funcionamento deles ou até mesmo derrubá-los momentaneamente - sim, aconteceu com o dbgames.info durante o desenvolvimento do projeto por um descuido meu.

## Como contribuir

Este projeto é open source e qualquer pessoa pode contribuir. Para contribuir, basta seguir os passos abaixo:

1. Fork este repositório
2. Crie uma branch para a sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT, mas os dados extraídos são de propriedade de seus respectivos autores.