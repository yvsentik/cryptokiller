import {JSDOM} from 'jsdom'
import axios from "axios";
import {symbols} from "./symbols";
import puppeteer from 'puppeteer';
import {BestchangePageService} from "./services/BestchangePage/Bestchange-page.service";

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const table_selector = '#content_table tbody .sd';


const link_template = (id: string) => `https://www.bestchange.com/index.php?mt=twostep&from=${id}&to=${id}&sort=from&range=asc`


async function run() {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const bceService = new BestchangePageService(
        browser
    );

    // const symbol = symbols[0];
    //
    // const page = await bceService.getOrAdd(symbol);
    //
    // const rates = await page.getExchangeRates();
    //
    // console.log(JSON.stringify(page.getBestExchangeRates(rates, 5), null, 2));

    // проходит по всем валютным парам: BTC->BTC/LTC->LTC
    for (let i = 0; i < symbols.length; i++) {
        console.log('---- ' + i)
        const symbol = symbols[i];

        // открывает вкладки
        const page = await bceService.getOrAdd(symbol);

        const rates = await page.getExchangeRates();

        setInterval(() => {
            let data = page.getBestExchangeRates(rates, 5);

            data = data.filter(x => {
                return  x.data.some(d => {
                    if (symbols.findIndex(x => x.symbol === d.from.curr) < 0) {
                        console.log(d.from.curr)
                        return false
                    };
                    if (symbols.findIndex(x => x.symbol === d.to.curr) < 0) {
                        console.log(d.to.curr)
                        return false
                    };

                    return true;
                })
            })
            // работа с данными

            // console.log(symbol, JSON.stringify(data, null, 2));
        }, 10000)

        // ждет 5 сек после каждой валютной пары, чтобы небыло капчи
        await sleep(2000);

    }
}


run().then(console.log);