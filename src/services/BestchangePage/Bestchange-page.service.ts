import puppeteer from "puppeteer";
import {BestchangePageEntity} from "./Bestchange-page.entity";
import {CryptoSymbol} from "../../interfaces/Crypto-symbol.interface";
import {link_template} from "../../utils/link-template";


export class BestchangePageService {
    constructor(
        public browser: puppeteer.Browser,
        public pages: BestchangePageEntity[] = []
    ) {
    }

    public async getOrAdd(symbol: CryptoSymbol) {
        return this.pages.find(x => x.symbol === symbol) ?? await this.add(symbol);
    }

    public save() {
        // TO-DO
    }

    private async add(symbol: CryptoSymbol) {
        const page =  await BestchangePageEntity.create(symbol, this.browser, link_template(symbol.id), '#rates_block')
        this.pages.push(page)

        return page;
    }
}