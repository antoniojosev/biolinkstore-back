import { Injectable } from '@nestjs/common';

interface AttributeOption {
  name: string;
  options: string[];
}

interface VariantCombination {
  [attributeName: string]: string;
}

@Injectable()
export class VariantGeneratorService {
  /**
   * Generates all possible combinations of product variants based on attributes
   * Example:
   * Input: [{ name: 'Size', options: ['S', 'M'] }, { name: 'Color', options: ['Red', 'Blue'] }]
   * Output: [
   *   { Size: 'S', Color: 'Red' },
   *   { Size: 'S', Color: 'Blue' },
   *   { Size: 'M', Color: 'Red' },
   *   { Size: 'M', Color: 'Blue' }
   * ]
   */
  generateCombinations(attributes: AttributeOption[]): VariantCombination[] {
    if (attributes.length === 0) {
      return [];
    }

    const combinations: VariantCombination[] = [];
    this.generateCombinationsRecursive(attributes, 0, {}, combinations);
    return combinations;
  }

  private generateCombinationsRecursive(
    attributes: AttributeOption[],
    index: number,
    current: VariantCombination,
    result: VariantCombination[],
  ): void {
    if (index === attributes.length) {
      result.push({ ...current });
      return;
    }

    const attribute = attributes[index];
    for (const option of attribute.options) {
      current[attribute.name] = option;
      this.generateCombinationsRecursive(attributes, index + 1, current, result);
    }
  }

  /**
   * Generates a readable variant name from combination
   * Example: { Size: 'M', Color: 'Red' } -> "M / Red"
   */
  generateVariantName(combination: VariantCombination): string {
    return Object.values(combination).join(' / ');
  }
}
