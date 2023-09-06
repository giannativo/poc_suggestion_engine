import { Injectable } from '@nestjs/common';
import { Engine } from "json-rules-engine";

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
            path: '$.*',
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
    this.engine.addOperator('wordEndsWith', (factValue: string[], jsonValue: string) => {
      const pattern = new RegExp(`${jsonValue}$`);
      const results = factValue.map((word) => pattern.test(word));
      return results[0];
    })
  }

  async findGrammarSuggestions(text: string): Promise<any[]> {
    let suggestions = [];
    const facts = { word: text.split(/\s+/) };
    try {
      const results = await this.engine.run(facts);
      suggestions = results.events.filter(event => event.type === "adverb_error")
      .map(event => event.params.message);
    }
    catch (err) {
      console.error(err);
      suggestions = [];
    }
    return suggestions;
  }
}
