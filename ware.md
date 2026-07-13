# Соответствие ID складов Wildberries

## Официальные API (требуется API-ключ продавца)

### Suppliers API
```
GET https://suppliers-api.wildberries.ru/api/v3/warehouses
Header: Authorization: <API-ключ>
```
Возвращает полный список складов с ID и названиями.

### Statistics API
```
GET https://statistics-api.wildberries.ru/api/v1/warehouses
Header: Authorization: <API-ключ>
```

## Публичные веб-ресурсы

### Карта складов wbarcode.ru
- **Список всех складов (названия):** https://wbarcode.ru/warehouses
- **Страницы отдельных складов:** `/warehouses/<slug>` (например, `/warehouses/koledino`, `/warehouses/novosibirsk`, `/warehouses/domodedovo`)
- Содержит адреса, координаты, информацию о режиме работы (но ID складов на страницах не отображаются, только названия)

### Статья с перечнем складов (litestat.io)
- https://litestat.io/blog/sklady-wildberries-adresa-zony-pokrytiya-koordinaty/
- Адреса и описания основных складов, но без ID

### Карта складов WB prod
- https://wbprod.ru/zony-pokritiya-skladov-wb/Novosibirsk/

### Wildberries Edu
- https://wildberries-edu.ru/sklady-wildberries/

## Community-ресурсы (GitHub)

Репозитории, в которых могут быть JSON-файлы с маппингом:
- https://github.com/eslazarev/wildberries-sdk — OpenAPI-спецификации WB API
- https://github.com/ilyautov/marketplaces-mcp-ru — MCP-сервер для WB, маппинги внутри
- https://github.com/salacoste/daytona-wildberries-typescript-sdk — TypeScript SDK

Поискать по GitHub: `wb warehouses`, `wb-warehouses`, `wildberries warehouses list`, `warehouses.json`

## Кабинет продавца
https://seller.wildberries.ru — при создании поставки или в разделе «Склады» видны ID.

## Известные ID складов (справочно)

| ID      | Название                     | Регион                |
|---------|------------------------------|-----------------------|
| 120602  | Коледино                     | Московская область    |
| 686     | Новосибирск                  | Новосибирская область |
| 116433  | Домодедово (Белые Столбы)    | Московская область    |
| 117986  | Казань                       | Татарстан             |
| 118535  | Екатеринбург (Кольцово)      | Свердловская область  |
| 121709  | Санкт-Петербург (Шушары)     | Ленинградская область |
| 121710  | Подольск                     | Московская область    |
| 98591   | Краснодар                    | Краснодарский край    |
| 207743  | Хабаровск                    | Хабаровский край      |
| 98774   | Горячий Ключ                 | Краснодарский край    |
| 119698  | Ростов-на-Дону               | Ростовская область    |

## Пути к статическим файлам WB (могут не работать)
```
https://catalog.wb.ru/catalog/warehouse/v1/warehouses
https://static-basket-01.wb.ru/vol0/data/warehouses.json
https://static-basket-01.wbbasket.ru/vol0/data/warehouses.json
```
Большинство эндпоинтов WB защищены антибот-системой (498 ошибка).
