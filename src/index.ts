import {JSDOM} from 'jsdom'
import axios from "axios";
import {symbols} from "./symbols";
import cli_query from 'cli-interact';
import {Decimal} from 'decimal.js'


//console.log(symbols)
function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const table_selector = '#content_table tbody .sd';


const link_template = (id: string) => `https://www.bestchange.com/action.php`


async function run() {
    const bitcoin = symbols.findIndex(x => x.symbol === 'BTC')!;
    // await collectData(bitcoin);

    // проходит по всем валютным парам: BTC->BTC/LTC->LTC
    for (let i = 0; i < symbols.length; i++) {
        console.log('---- ' + i)
        const symbol = symbols[i];
        if (symbol.symbol === 'BTC') continue;

        try {
            await collectData(symbol);
            console.log(symbol.symbol + ' done')
        } catch (err) {
            console.error(symbol.symbol + ' not done')
        }

        // обход капчи_cool)))
        await sleep(4000);

    }
}


async function collectData(symbol: { id: string, symbol: string }): Promise<any> {
    console.log(link_template(symbol.id))
    const res = await axios.post(link_template(symbol.id), {

        action: 'getrates',
        page: 'twostep',
        from: symbol.id,
        to: symbol.id,
        city: 0,
        type: 'give',
        get: '',
        commission: 0,
        sort: 'from',
        range: 'asc',
        sortm: 0,
        tsid: 149
    }, {
        headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": "PHPSESSID=je24mc21mnbnu1a8ccpifdo5h0; userid=a55cae5c9f5203d63296b77a8ad1ee3a; _ga=GA1.2.1900205647.1649688649; _gid=GA1.2.1983221291.1649688649; _gat_gtag_UA_50102629_1=1"
        },
    });

    console.log(`Symbol ${symbol.symbol}`)
    // курс обмена бинанаса на юсдт выбранно валюты
    try {
        const exchange_rate = (await axios.get(`https://api1.binance.com/api/v3/avgPrice?symbol=${symbol.symbol}USDT`)).data.price;

        //сколько меняем на сколько

        console.log(`Exchange rate ${symbol.symbol}: ${exchange_rate}`)
        console.log('-----------------------------------------------------------------')
    } catch {}


    const dom = new JSDOM(res.data);
    const {document} = dom.window;
    console.log(res.data, 'dadas')
    // if (!document.querySelector('.sidebar')) {
    //     console.log('Captcha')
    //     cli_query.getYesNo('Введите капчу и нажмите Enter')
    //     return collectData(symbol);
    // }
    const table_nodes = document.querySelectorAll(table_selector)!;
    console.log(table_nodes.length)
    const exchange_rates: {
        data: {exchanger: string, from: {curr: string, amount: string}, to: {curr: string, amount: string}}[],
        rate: Decimal[]
    }[] = [];

    // цикл для всех двойных обменов
    for (let i = 0; i < table_nodes.length; i++) {
        const nodes = table_nodes.item(i)!.querySelectorAll('.exinfo');


        const currencies: string[] = [];
        const exchangers: string[] = [];
        const amount: string[][] = [];
        // cнизу конст
        //тут трабл!!!!!!!!!
        const rate = table_nodes.item(1).previousElementSibling!.querySelector('.bj.bp')!.textContent!.split(':').map(x => x); // [0] -> input value, [1] -> output value
        // if(rate[0]<1){
        //     break;
        // }
        nodes.forEach(x => {
            const currency_nodes = x.querySelectorAll('.bt');

            currency_nodes.forEach(node => currencies.push(node.textContent!));


            const active_tds = x.querySelectorAll('tbody .active td');

            exchangers.push(active_tds.item(1).textContent!);
            amount.push(active_tds.item(2).textContent!.split(' → '))
        })


        exchange_rates.push({
            data: [{
                exchanger: exchangers[0],

                from: {
                    curr: currencies[0],
                    amount: (amount[0][0])
                },
                to: {
                    curr: currencies[1],
                    amount: (amount[0][1])
                },
            },
                {
                    exchanger: exchangers[1],

                    from: {
                        curr: currencies[2],
                        amount: (amount[1][0])
                    },
                    to: {
                        curr: currencies[3],
                        amount: (amount[1][1])
                    },
                }],
            rate: [new Decimal(rate[0]), new Decimal(rate[1])]
        })


        // Работай с data и rate здесь
        // Тут пиши логику лучшего курса,

        // let spred = (rate[1]/rate[0])*100-100;
        //     console.log(data, rate)
            // spred = Number((spred).toFixed(3));
            // console.log("спред: "+ spred+"%")
        // console.log(spred)

        // делаем выборку ликвида сегодня
        // сделать счетчик в процентах
        // пофиксить баг с DOGE TRC20 и тд
        // сделать массив топ 5 лучших спредов в зависимости
        // красивое сообщение в телегу
        // кнопка деньги ready
        // if (i > numberOfExchanges) break;
    }

    console.log(exchange_rates.sort((a, b) => {
        return a.rate[0].comparedTo(b.rate[0]);
    })[0])
}
run().then(console.log);