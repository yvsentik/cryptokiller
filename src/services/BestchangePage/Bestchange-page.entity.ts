import Decimal from "decimal.js";
import puppeteer from "puppeteer";
import {CryptoSymbol} from "../../interfaces/Crypto-symbol.interface";

export class BestchangePageEntity {
    constructor(
        public page: puppeteer.Page,
        public symbol: CryptoSymbol
    ) {
    }

    static async create(symbol: CryptoSymbol, browser: puppeteer.Browser, url: string, waitFroSelector: string) {
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080
        })
        await page.goto(url);
        await page.waitForSelector(waitFroSelector);

        return new BestchangePageEntity(page, symbol);
    }

    async getExchangeRates(): Promise<ExchangeRate[]> {
        const exchange_rates = await this.page.evaluate(() => {
            const bottom_nodes = document.querySelectorAll('#rates_block .sd')!;

            const exchange_rates: ExchangeRate[] = [];

            let data: any = undefined

            for (let i = 0; i < bottom_nodes.length; i++) {
                const bottom_node = bottom_nodes.item(i)!;

                const top_node = bottom_node.previousElementSibling!;

                //@ts-ignore
                const rate: [string, string] = top_node.querySelector('.bp')!.textContent!.split(':');

                const bi_nodes = bottom_node.querySelectorAll('span.bi');
                const exchanger_nodes = bottom_node.querySelectorAll('.desc a');
                const currency_nodes = bottom_node.querySelectorAll('small');


                exchange_rates.push({
                    data: [
                        {
                            name: exchanger_nodes.item(0).textContent!,
                            //@ts-ignore
                            href: exchanger_nodes.item(0).href,
                            from: {
                                curr: currency_nodes[0].textContent!,
                                amount: bi_nodes[0].textContent!
                            },
                            to: {
                                curr: currency_nodes[1].textContent!,
                                amount: bi_nodes[1].textContent!
                            }
                            // from:
                        },
                        {
                            name: exchanger_nodes.item(2).textContent!,
                            //@ts-ignore
                            href: exchanger_nodes.item(2).href,
                            from: {
                                curr: currency_nodes[2].textContent!,
                                amount: bi_nodes[2].textContent!
                            },
                            to: {
                                curr: currency_nodes[3].textContent!,
                                amount: bi_nodes[3].textContent!
                            }
                        }
                    ],
                    rate
                })
            }


            return exchange_rates;
        })

        return exchange_rates
    }


    getBestExchangeRates(rates: ExchangeRate[], amount: number) {
        return rates.sort((a,b) => {
            const aRate = new Decimal(a.rate[0]);
            const bRate = new Decimal(b.rate[0]);

            return aRate.comparedTo(bRate);
        }).slice(0, amount);
    }
}

export interface ExchangeRate {
    data: {
        name: string,
        href: string
        from: { curr: string, amount: string },
        to: { curr: string, amount: string }
    }[],
    rate: string[]
}