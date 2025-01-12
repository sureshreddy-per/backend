import { Injectable, Logger } from '@nestjs/common';
import { LanguageService } from '../../config/language.service';

@Injectable()
export class MockAiSynonymService {
  private readonly logger = new Logger(MockAiSynonymService.name);
  private readonly mockData: { [key: string]: any } = {
    'tomato': {
      synonyms: ['tomato', 'tomatoes', 'cherry tomato', 'roma tomato', 'plum tomato'],
      translations: {
        hi: ['टमाटर', 'टमाटा', 'टमेटो'],
        bn: ['টমেটো', 'বিলাতি বেগুন', 'টম্যাটো'],
        te: ['టమాటో', 'టొమాటో', 'టమాట'],
        ta: ['தக்காளி', 'தொமாட்டோ', 'தக்காளிப்பழம்'],
        mr: ['टोमॅटो', 'टमाटर', 'रामफळ'],
        gu: ['ટમેટા', 'ટામેટા', 'રતાડુ'],
        kn: ['ಟೊಮೆಟೊ', 'ಟೊಮಾಟೊ', 'ಟಮೋಟ'],
        ml: ['തക്കാളി', 'തൊമാറ്റോ', 'പച്ചത്തക്കാളി'],
        pa: ['ਟਮਾਟਰ', 'ਟਮਾਟੋ', 'ਵਿਲਾਇਤੀ ਬੈਂਗਣ'],
        or: ['ଟମାଟୋ', 'ବିଲାତି ବାଇଗଣ', 'ଟମାଟର'],
        as: ['টমেটো', 'বিলাহী', 'টমেটৰ'],
        es: ['tomate', 'jitomate', 'tomatera'],
        fr: ['tomate', 'pomme d\'amour', 'tomates cerises']
      }
    },
    'potato': {
      synonyms: ['potato', 'potatoes', 'white potato', 'irish potato', 'spud'],
      translations: {
        hi: ['आलू', 'बटाटा', 'आलू मुर्गी'],
        bn: ['আলু', 'গোল আলু', 'বটাটা'],
        te: ['బంగాళదుంప', 'ఆలుగడ్డ', 'బటాటా'],
        ta: ['உருளைக்கிழங்கு', 'கிழங்கு', 'பொட்டாட்டோ'],
        mr: ['बटाटा', 'आलू', 'बटाट्या'],
        gu: ['બટાકા', 'બટાટા', 'આલુ'],
        kn: ['ಆಲೂಗಡ್ಡೆ', 'ಬಟಾಟೆ', 'ಉರುಳೆಗಡ್ಡೆ'],
        ml: ['ഉരുളക്കിഴങ്ങ്', 'പൊട്ടാറ്റോ', 'കിഴങ്ങ്'],
        pa: ['ਆਲੂ', 'ਬਟਾਟਾ', 'ਆਲੂਆਂ'],
        or: ['ଆଳୁ', 'ବଟାଟା', 'ଆଳୁଆ'],
        as: ['আলু', 'বটাটা', 'আলুৱা'],
        es: ['patata', 'papa', 'tubérculo'],
        fr: ['pomme de terre', 'patate', 'tubercule']
      }
    },
    'onion': {
      synonyms: ['onion', 'onions', 'red onion', 'white onion', 'yellow onion'],
      translations: {
        hi: ['प्याज', 'प्याज़', 'पलांडू'],
        bn: ['পেঁয়াজ', 'পিঁয়াজ', 'পলান্ডু'],
        te: ['ఉల్లిపాయ', 'నిల్లి', 'ఉల్లి'],
        ta: ['வெங்காயம்', 'ஈருள்ளி', 'உள்ளி'],
        mr: ['कांदा', 'प्याज', 'पलांडू'],
        gu: ['ડુંગળી', 'કાંદા', 'પ્યાજ'],
        kn: ['ಈರುಳ್ಳಿ', 'ನೀರುಳ್ಳಿ', 'ಉಳ್ಳಿ'],
        ml: ['ഉള്ളി', 'സവോള', 'ചുവന്നുള്ളി'],
        pa: ['ਪਿਆਜ਼', 'ਗੰਢਾ', 'ਪਿਆਜ'],
        or: ['ପିଆଜ', 'ପଳାଣ୍ଡୁ', 'ପିୟାଜ'],
        as: ['পিয়াজ', 'পেঁয়াজ', 'পলান্দু'],
        es: ['cebolla', 'cebolleta', 'cebollín'],
        fr: ['oignon', 'échalote', 'ciboule']
      }
    }
  };

  constructor(private readonly languageService: LanguageService) {}

  private getClosestMatch(word: string): string {
    // Convert to lowercase for comparison
    const searchWord = word.toLowerCase();
    
    // First try exact match
    if (this.mockData[searchWord]) {
      return searchWord;
    }

    // Try to find in synonyms
    for (const [key, data] of Object.entries(this.mockData)) {
      if (data.synonyms.some(s => s.toLowerCase() === searchWord)) {
        return key;
      }
      
      // Try translations
      for (const translations of Object.values(data.translations)) {
        if ((translations as string[]).some(t => t.toLowerCase() === searchWord)) {
          return key;
        }
      }
    }

    // If no match found, return the original word
    return word;
  }

  async generateSynonyms(word: string): Promise<{
    synonyms: string[];
    translations: { [key: string]: string[] };
  }> {
    try {
      this.logger.log(`Generating mock synonyms for: ${word}`);
      
      // Find closest matching word in mock data
      const matchedWord = this.getClosestMatch(word);
      
      if (this.mockData[matchedWord]) {
        // Return mock data for the matched word
        return {
          synonyms: this.mockData[matchedWord].synonyms,
          translations: this.mockData[matchedWord].translations
        };
      }

      // If no match found, return minimal result with just the original word
      const defaultTranslations = {};
      this.languageService.getActiveLanguageCodes().forEach(code => {
        defaultTranslations[code] = [word];
      });

      return {
        synonyms: [word],
        translations: defaultTranslations
      };
    } catch (error) {
      this.logger.error(`Error generating mock synonyms for "${word}": ${error.message}`);
      return {
        synonyms: [word],
        translations: {}
      };
    }
  }
} 