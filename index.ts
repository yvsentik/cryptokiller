import {JSDOM} from 'jsdom'
import axios from "axios";
import {symbols} from "./symbols";
//console.log(symbols)
function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const table_selector = '#content_table tbody .sd';


const link_template = (id: string) => `https://www.bestchange.com/index.php?mt=twostep&from=${id}&to=${id}&sort=from&range=asc`


async function run() {
    // проходит по всем валютным парам: BTC->BTC/LTC->LTC
    for (let i = 0; i < symbols.length; i++) {
        console.log('---- ' + i)
        const symbol = symbols[i];

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


async function collectData(symbol: { id: string, symbol: string }) {
    const res = await axios.get(link_template(symbol.id));

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

    const table_nodes = document.querySelectorAll(table_selector)!;

    // цикл для всех двойных обменов
    for (let i = 0; i < table_nodes.length; i++) {
        const nodes = table_nodes.item(i)!.querySelectorAll('.exinfo');


        const currencies: string[] = [];
        const exchangers: string[] = [];
        const amount: string[][] = [];
        // cнизу конст
        //тут трабл!!!!!!!!!
        const rate = table_nodes.item(1).previousElementSibling!.querySelector('.bj.bp')!.textContent!.split(':').map(x => parseFloat(x)); // [0] -> input value, [1] -> output value
        if(rate[0]<1){
            break;
        }
        nodes.forEach(x => {
            const currency_nodes = x.querySelectorAll('.bt');

            currency_nodes.forEach(node => currencies.push(node.textContent!));


            const active_tds = x.querySelectorAll('tbody .active td');

            exchangers.push(active_tds.item(1).textContent!);
            amount.push(active_tds.item(2).textContent!.split(' → '))
        })


        const data = [
            {
                exchanger: exchangers[0],

                from: {
                    curr: currencies[0],
                    amount: parseFloat(amount[0][0])
                },
                to: {
                    curr: currencies[1],
                    amount: parseFloat(amount[0][1])
                },
            },
            {
                exchanger: exchangers[1],

                from: {
                    curr: currencies[2],
                    amount: parseFloat(amount[1][0])
                },
                to: {
                    curr: currencies[3],
                    amount: parseFloat(amount[1][1])
                },
            }
        ]

        
        // Работай с data и rate здесь
        // Тут пиши логику лучшего курса,

         let spred = 0;
         if(((rate[1]/rate[0])*100-100)>0){
             spred = (rate[1]/rate[0])*100-100
             console.log(data, rate)
             spred = Number((spred).toFixed(3));
             console.log("спред: "+ spred+"%")
        }
       //console.log(data, rate)

        // делаем выборку ликвида сегодня 
        // сделать счетчик в процентах
        // пофиксить баг с DOGE TRC20 и тд 
        // сделать массив топ 5 лучших спредов в зависимости
        // красивое сообщение в телегу
        // кнопка деньги ready
        break; // if (i > numberOfExchanges) break;
    }
}
run().then(console.log);