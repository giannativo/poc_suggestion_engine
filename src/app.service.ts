import { Injectable } from '@nestjs/common';
import { Engine } from "json-rules-engine";
import { stripHtml } from 'string-strip-html';

@Injectable()
export class AppService {
  private engine: Engine;

  constructor() {
    this.engine = new Engine();
    this.initializeRules();
  }

  private initializeRules() {
    const adverbRule = {
      conditions: {
        any: [
          {
            fact: "word",
            operator: "wordEndsWith",
            value: "ly"
          }
        ]
      },
      event: {
        type: "adverb_error",
        params: {
          message: "Consider eliminating the adverb for a more direct sentence."
        },
      }
    };
    this.engine.addRule(adverbRule);
    this.engine.addOperator('wordEndsWith', (factValue: string, jsonValue: string) => {
      const pattern = new RegExp(`${jsonValue}$`);
      return pattern.test(factValue);
    })
  }

  async findGrammarSuggestions(text: string): Promise<Object> {
    let plainText = this.convertHtmlToPlainText(text);
    let suggestions = {
      "originalText": text,
      "errors": []
    };
    const words = text.split(/\s+/);
    for (let word of words) {
      try {
        let facts = { word: word };
        let results = await this.engine.run(facts);
        let errorMessages = results.events.filter(event => event.type === "adverb_error")
        .map(event => event.params.message);
        if (errorMessages.length) {
          suggestions.errors.push({
            wordChecked: word,
            messages: errorMessages
          })          
        }       
      }
      catch (err) {
        console.error(err);
        return {};
      }
    }
    return suggestions;
  }

  convertHtmlToPlainText(htmlText: string): string {
    return stripHtml(htmlText).result;
  }
}
