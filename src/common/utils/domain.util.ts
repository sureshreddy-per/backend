import * as tr46 from 'tr46';

export class DomainUtil {
  static toASCII(domain: string): string {
    const result = tr46.toASCII(domain, {
      checkBidi: true,
      checkHyphens: true,
      checkJoiners: true,
      useSTD3ASCIIRules: true,
      verifyDNSLength: true,
    });
    return result;
  }

  static toUnicode(domain: string): string {
    const result = tr46.toUnicode(domain, {
      checkBidi: true,
      checkHyphens: true,
      checkJoiners: true,
      useSTD3ASCIIRules: true,
    });
    return result;
  }
} 