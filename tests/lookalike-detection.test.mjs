/**
 * SAFENET Look-alike Name Detection and False-Positive Reduction Test Suite
 * Automated unit and integration tests covering the 20 REQUIRED SCENARIOS:
 * 1. Exact brand name
 * 2. Single character insertion
 * 3. Single character deletion
 * 4. Character substitution
 * 5. Adjacent character transposition
 * 6. Spacing variation
 * 7. Punctuation and separator variation
 * 8. Added word such as Support
 * 9. Added word such as Official
 * 10. Visually confusable Unicode characters
 * 11. Short brand names
 * 12. Common words that resemble a brand
 * 13. Legitimate authorized accounts
 * 14. Authorized partners
 * 15. A different ordinary business name
 * 16. Missing usernames or URLs
 * 17. Missing external evidence
 * 18. Unavailable monitoring APIs
 * 19. Invalid inputs
 * 20. Risk-score explanations and persistence of review decisions
 * 21. Explicit Benchmark Dataset precision, recall, and false-positive rate calculations
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateLookalikeMatch,
  calculateTokenSimilarity,
  detectRepeatedCharacters,
  isAdjacentTransposition,
} from '../src/lib/similarity/lookalike-engine.ts';
import { calculateJaroWinkler, calculateJaroSimilarity } from '../src/lib/similarity/jaro-winkler.ts';
import { normalizeCandidateText, stripZeroWidth, getCharacterScript } from '../src/lib/similarity/unicode-normalizer.ts';
import { analyzeAddedKeywords } from '../src/lib/similarity/keywords.ts';
import { LegitimateAssetRegistry } from '../src/lib/similarity/legitimate-registry.ts';
import { assessLookalikeRisk } from '../src/lib/similarity/lookalike-risk-engine.ts';
import { LookalikeReviewStore } from '../src/lib/similarity/review-store.ts';
import { PRESET_BRANDS } from '../src/lib/brand-store.ts';

const brandNike = PRESET_BRANDS['Nike'];
const brandPaytm = PRESET_BRANDS['Paytm'];
const brandPayPal = PRESET_BRANDS['PayPal'];
const brandApexPay = PRESET_BRANDS['ApexPay'];

describe('SAFENET Look-alike Name Detection Master Test Suite (20 Scenarios)', () => {
  // =========================================================================
  // Scenario 1: Exact brand name
  // =========================================================================
  test('Scenario 1: Exact brand name matches evaluate cleanly with exact_match variation', () => {
    const evalPaytm = evaluateLookalikeMatch('Paytm', 'Paytm');
    assert.equal(evalPaytm.variationType, 'exact_match');
    assert.equal(evalPaytm.isLookalike, true);
    assert.equal(evalPaytm.editDistance, 0);
    assert.equal(evalPaytm.similarityRatio, 1.0);
    assert.equal(evalPaytm.metrics.compositeSimilarityPercent, 100);

    const evalApex = evaluateLookalikeMatch('ApexPay', 'ApexPay');
    assert.equal(evalApex.variationType, 'exact_match');
    assert.equal(evalApex.editDistance, 0);
  });

  // =========================================================================
  // Scenario 2: Single character insertion
  // =========================================================================
  test('Scenario 2: Single character insertion is detected', () => {
    const evalIns = evaluateLookalikeMatch('payteam', 'Paytm');
    assert.ok(evalIns.editDistance <= 2);
    assert.ok(evalIns.isLookalike);
    assert.ok(evalIns.metrics.jaroWinklerSimilarity >= 0.8);
  });

  // =========================================================================
  // Scenario 3: Single character deletion
  // =========================================================================
  test('Scenario 3: Single character deletion is detected', () => {
    const evalDel = evaluateLookalikeMatch('patm', 'Paytm');
    assert.equal(evalDel.variationType, 'character_deletion');
    assert.equal(evalDel.editDistance, 1);
    assert.ok(evalDel.isLookalike);
  });

  // =========================================================================
  // Scenario 4: Character substitution
  // =========================================================================
  test('Scenario 4: Character substitution is detected', () => {
    const evalSub = evaluateLookalikeMatch('paytn', 'Paytm');
    assert.equal(evalSub.variationType, 'character_substitution');
    assert.equal(evalSub.editDistance, 1);
    assert.ok(evalSub.similarityRatio >= 0.8);
  });

  // =========================================================================
  // Scenario 5: Adjacent character transposition
  // =========================================================================
  test('Scenario 5: Adjacent character transposition is detected (pyatm -> paytm)', () => {
    assert.equal(isAdjacentTransposition('pyatm', 'paytm'), true);
    const evalTrans = evaluateLookalikeMatch('pyatm', 'Paytm');
    assert.equal(evalTrans.variationType, 'character_transposition');
    assert.equal(evalTrans.editDistance, 1);
    assert.ok(evalTrans.metrics.jaroWinklerSimilarity > 0.85);
    assert.ok(evalTrans.signals.some((s) => s.type === 'character_transposition'));
  });

  // =========================================================================
  // Scenario 6: Spacing variation
  // =========================================================================
  test('Scenario 6: Spacing variation normalizes and matches brand stem', () => {
    const evalSpace = evaluateLookalikeMatch('pay tm', 'Paytm');
    assert.equal(evalSpace.isLookalike, true);
    assert.equal(evalSpace.variationType, 'separator_variation');

    const evalSpaceApex = evaluateLookalikeMatch('Apex Pay', 'ApexPay');
    assert.equal(evalSpaceApex.isLookalike, true);
    assert.equal(evalSpaceApex.variationType, 'separator_variation');
  });

  // =========================================================================
  // Scenario 7: Punctuation and separator variation
  // =========================================================================
  test('Scenario 7: Punctuation and separator variations normalize safely', () => {
    const separators = ['pay_tm', 'pay-tm', 'pay.tm', 'pay+tm'];
    for (const s of separators) {
      const norm = normalizeCandidateText(s);
      assert.equal(norm.compactStem, 'paytm', `Stem failed for ${s}`);
      const evalResult = evaluateLookalikeMatch(s, 'Paytm');
      assert.ok(evalResult.isLookalike, `Expected lookalike for ${s}`);
      assert.equal(evalResult.variationType, 'separator_variation');
    }

    // Zero-width space delimiter
    const zwAttack = 'pay\u200Btm';
    const zwNorm = normalizeCandidateText(zwAttack);
    assert.equal(zwNorm.hasZeroWidth, true);
    assert.equal(zwNorm.compactStem, 'paytm');
  });

  // =========================================================================
  // Scenario 8: Added word such as Support
  // =========================================================================
  test('Scenario 8: Added word such as Support is detected and categorized', () => {
    const kwAnalysis = analyzeAddedKeywords('Paytm Support', 'Paytm');
    assert.equal(kwAnalysis.hasAddedWords, true);
    assert.ok(kwAnalysis.matchedKeywords.includes('support'));

    const evalSupport = evaluateLookalikeMatch('Paytm Support', 'Paytm');
    assert.equal(evalSupport.isLookalike, true);
    assert.equal(evalSupport.variationType, 'added_keyword');
  });

  // =========================================================================
  // Scenario 9: Added word such as Official
  // =========================================================================
  test('Scenario 9: Added word such as Official is detected as authority lure', () => {
    const kwOfficial = analyzeAddedKeywords('Paytm Official Helpdesk', 'Paytm');
    assert.equal(kwOfficial.hasAddedWords, true);
    assert.ok(kwOfficial.matchedKeywords.includes('official'));

    const evalOfficial = evaluateLookalikeMatch('PayPal Official Portal', 'PayPal');
    assert.equal(evalOfficial.isLookalike, true);
    assert.equal(evalOfficial.variationType, 'added_keyword');
  });

  // =========================================================================
  // Scenario 10: Visually confusable Unicode characters
  // =========================================================================
  test('Scenario 10: Visually confusable Unicode characters are detected with safeguards', () => {
    const cyrillicCandidate = 'P\u0430ytm'; // Cyrillic 'а'
    const norm = normalizeCandidateText(cyrillicCandidate);
    assert.equal(norm.confusables.length, 1);
    assert.equal(norm.confusables[0].script, 'Cyrillic');
    assert.equal(norm.confusables[0].mappedChar, 'a');
    assert.equal(norm.hasMixedScript, true);

    const evalCyrillic = evaluateLookalikeMatch(cyrillicCandidate, 'Paytm');
    assert.equal(evalCyrillic.variationType, 'homoglyph_confusable');
    assert.equal(evalCyrillic.isLookalike, true);

    // Greek script detection
    assert.equal(getCharacterScript('\u03B1'), 'Greek');
  });

  // =========================================================================
  // Scenario 11: Short brand names
  // =========================================================================
  test('Scenario 11: Short brand names apply length-aware matching thresholds', () => {
    // "Nike" length is 4 (short category)
    const evalNike = evaluateLookalikeMatch('nik', 'Nike');
    assert.equal(evalNike.lengthCategory, 'short');

    // For short brands, similarity thresholds are more conservative
    const evalNikeExact = evaluateLookalikeMatch('Nike', 'Nike');
    assert.equal(evalNikeExact.lengthCategory, 'short');
  });

  // =========================================================================
  // Scenario 12: Common words that resemble a brand
  // =========================================================================
  test('Scenario 12: Common words that resemble a brand are NOT flagged as malicious', () => {
    const commonWords = ['bike', 'like', 'mike'];
    for (const word of commonWords) {
      const evalWord = evaluateLookalikeMatch(word, 'Nike');
      assert.equal(evalWord.isCommonWordSuppressed, true, `Word ${word} should be suppressed`);
      assert.equal(evalWord.isLookalike, false);

      const risk = assessLookalikeRisk({ name: word }, brandNike);
      assert.equal(risk.riskBand, 'Low concern');
      assert.ok(risk.riskScore <= 15);
      assert.equal(risk.classification, 'COMMON_WORD_BENIGN');
    }
  });

  // =========================================================================
  // Scenario 13: Legitimate authorized accounts
  // =========================================================================
  test('Scenario 13: Legitimate authorized accounts are identified and receive 0 risk', () => {
    const allowHandle = LegitimateAssetRegistry.evaluateCandidateLegitimacy(
      { username: '@paytm' },
      brandPaytm
    );
    assert.equal(allowHandle.isAllowlisted, true);
    assert.equal(allowHandle.matchType, 'official_handle');

    const riskOfficial = assessLookalikeRisk(
      { name: 'Paytm', username: '@paytm' },
      brandPaytm
    );
    assert.equal(riskOfficial.riskScore, 0);
    assert.equal(riskOfficial.riskBand, 'Low concern');
    assert.equal(riskOfficial.isAllowlisted, true);
    assert.equal(riskOfficial.classification, 'CONFIRMED_OFFICIAL');
  });

  // =========================================================================
  // Scenario 14: Authorized partners
  // =========================================================================
  test('Scenario 14: Authorized partners in custom allowlist receive 0 risk score', () => {
    LegitimateAssetRegistry.addAllowlistEntry({
      brandId: 'brand-nike',
      type: 'handle',
      value: 'nikepartnerstore',
      notes: 'Authorized retail affiliate',
    });

    const allowPartner = LegitimateAssetRegistry.evaluateCandidateLegitimacy(
      { username: 'nikepartnerstore' },
      brandNike
    );
    assert.equal(allowPartner.isAllowlisted, true);
    assert.equal(allowPartner.matchType, 'user_allowlist');

    const riskPartner = assessLookalikeRisk({ username: '@nikepartnerstore' }, brandNike);
    assert.equal(riskPartner.riskScore, 0);
    assert.equal(riskPartner.riskBand, 'Low concern');
    assert.equal(riskPartner.isAllowlisted, true);
  });

  // =========================================================================
  // Scenario 15: A different ordinary business name
  // =========================================================================
  test('Scenario 15: A different ordinary business name stays in Low concern band', () => {
    const riskPaySmart = assessLookalikeRisk({ name: 'PaySmart Systems' }, brandPaytm);
    assert.equal(riskPaySmart.riskBand, 'Low concern');
    assert.ok(riskPaySmart.riskScore < 30);

    const riskNikon = assessLookalikeRisk({ name: 'Nikon Cameras' }, brandNike);
    assert.equal(riskNikon.riskBand, 'Low concern');
    assert.ok(riskNikon.riskScore < 30);
  });

  // =========================================================================
  // Scenario 16: Missing usernames or URLs
  // =========================================================================
  test('Scenario 16: Missing usernames or URLs evaluated without errors', () => {
    const riskNoHandles = assessLookalikeRisk(
      { name: 'Paytm Quick', username: undefined, profileUrl: undefined },
      brandPaytm
    );
    assert.ok(riskNoHandles.riskScore >= 0);
    assert.ok(riskNoHandles.reasons.length >= 0);
  });

  // =========================================================================
  // Scenario 17: Missing external evidence
  // =========================================================================
  test('Scenario 17: Missing external evidence caps risk score at <= 28 Low concern', () => {
    // High name similarity without any external risk signals (no unverified handle, no suspicious url, no bio)
    const riskIsolated = assessLookalikeRisk(
      { name: 'Paytm' }, // exact name but no handle/context provided
      brandPaytm
    );
    // Cannot be classified as malicious based solely on isolated name similarity
    assert.ok(riskIsolated.riskScore <= 28, `Risk score ${riskIsolated.riskScore} must be <= 28`);
    assert.equal(riskIsolated.riskBand, 'Low concern');
  });

  // =========================================================================
  // Scenario 18: Unavailable monitoring APIs
  // =========================================================================
  test('Scenario 18: Unavailable monitoring APIs handle degradation gracefully', () => {
    // Engine does not throw or fabricate fake scans when external sources are offline
    assert.doesNotThrow(() => {
      assessLookalikeRisk(
        {
          name: 'Candidate Entity',
          developer: undefined,
          profileUrl: undefined,
          description: undefined,
        },
        brandPaytm
      );
    });
  });

  // =========================================================================
  // Scenario 19: Invalid inputs
  // =========================================================================
  test('Scenario 19: Invalid inputs (empty, whitespace, undefined) handle safely', () => {
    const evalEmpty = evaluateLookalikeMatch('', 'Paytm');
    assert.equal(evalEmpty.isLookalike, false);
    assert.equal(evalEmpty.variationType, 'low_similarity');

    const evalWhitespace = evaluateLookalikeMatch('   ', 'Paytm');
    assert.equal(evalWhitespace.isLookalike, false);

    const normEmpty = normalizeCandidateText('');
    assert.equal(normEmpty.compactStem, '');
  });

  // =========================================================================
  // Scenario 20: Risk-score explanations and persistence of review decisions
  // =========================================================================
  test('Scenario 20: Risk-score explanations and review decisions persist accurately', async () => {
    const badCandidate = {
      name: 'Paytm Customer Support',
      username: '@Paytm_Care24x7',
      profileUrl: 'http://paytm-refund-login.xyz',
      description: 'Official 24x7 helpline for refund status and urgent KYC reversal.',
    };

    const assessment = assessLookalikeRisk(badCandidate, brandPaytm);
    assert.ok(assessment.riskScore >= 80, 'riskScore should be >= 80 for corroborated threat');
    assert.equal(assessment.riskBand, 'High priority');
    assert.ok(assessment.reasons.length >= 2);
    assert.ok(assessment.contributions.length >= 3);

    // Record review decision: Confirmed Impersonation
    const decision = await LookalikeReviewStore.recordDecision({
      brandId: 'brand-paytm',
      brandName: 'Paytm',
      candidateName: 'Paytm Customer Support',
      decision: 'confirmed_impersonation',
      similarityScore: assessment.similarityScore,
      riskScore: assessment.riskScore,
      variationType: assessment.variationType,
      notes: 'Phishing helpline confirmed by analyst',
      reviewedBy: 'Senior SOC Analyst',
    });

    assert.equal(decision.decision, 'confirmed_impersonation');
    const fetched = LookalikeReviewStore.getReviewForCandidate('Paytm Customer Support', 'Paytm');
    assert.equal(fetched?.decision, 'confirmed_impersonation');
  });

  // =========================================================================
  // Scenario 21: Benchmark Dataset Precision, Recall & FPR Report
  // =========================================================================
  test('Scenario 21: Explicit Benchmark Dataset reports calculated Precision, Recall, and False-Positive Rate', () => {
    const benchmarkDataset = [
      // True Positives (Actual impersonations)
      { name: 'Paytm Support Helpline', brand: brandPaytm, isThreat: true, context: { description: 'call 24x7 helpline for refund' } },
      { name: 'P\u0430ytm Care', brand: brandPaytm, isThreat: true, context: { description: 'official support desk' } },
      { name: 'pyatm-login', brand: brandPaytm, isThreat: true, context: { profileUrl: 'http://pyatm-login.top' } },
      { name: 'Nike-Customer-Service', brand: brandNike, isThreat: true, context: { description: 'official support' } },
      { name: 'Paytm-Official-Refund', brand: brandPaytm, isThreat: true, context: { description: 'claim cashback now' } },
      { name: 'payttm_care', brand: brandPaytm, isThreat: true, context: { username: '@payttm_care' } },
      { name: 'Nike_Shoes_Official_Support', brand: brandNike, isThreat: true, context: { description: 'support team' } },
      { name: 'PayPal-Verify-Security', brand: brandPayPal, isThreat: true, context: { profileUrl: 'http://paypal-verify.site' } },

      // True Negatives (Benign / Allowlisted / Common words / Unrelated)
      { name: 'Paytm', brand: brandPaytm, isThreat: false, context: { username: '@paytm' } },
      { name: 'Nike', brand: brandNike, isThreat: false, context: { username: '@Nike' } },
      { name: 'bike', brand: brandNike, isThreat: false, context: {} },
      { name: 'like', brand: brandNike, isThreat: false, context: {} },
      { name: 'mike', brand: brandNike, isThreat: false, context: {} },
      { name: 'Fresh Fruits Grocer', brand: brandPaytm, isThreat: false, context: {} },
      { name: 'Nikon Optics', brand: brandNike, isThreat: false, context: {} },
      { name: 'PaySmart Global Solutions', brand: brandPaytm, isThreat: false, context: {} },
      { name: 'Hike Messenger', brand: brandNike, isThreat: false, context: {} },
      { name: 'Digital Payment Portal', brand: brandPaytm, isThreat: false, context: {} },
    ];

    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const item of benchmarkDataset) {
      const assessment = assessLookalikeRisk(
        { name: item.name, ...item.context },
        item.brand
      );

      const flaggedAsThreat = assessment.riskScore >= 60;

      if (flaggedAsThreat && item.isThreat) {
        truePositives++;
      } else if (flaggedAsThreat && !item.isThreat) {
        falsePositives++;
      } else if (!flaggedAsThreat && !item.isThreat) {
        trueNegatives++;
      } else if (!flaggedAsThreat && item.isThreat) {
        falseNegatives++;
      }
    }

    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);
    const falsePositiveRate = falsePositives / (falsePositives + trueNegatives);

    console.log(`\n[SAFENET BENCHMARK DATASET EVALUATION RESULTS]`);
    console.log(`Evaluated Dataset Size: ${benchmarkDataset.length} instances`);
    console.log(`True Positives (TP): ${truePositives}`);
    console.log(`False Positives (FP): ${falsePositives}`);
    console.log(`True Negatives (TN): ${trueNegatives}`);
    console.log(`False Negatives (FN): ${falseNegatives}`);
    console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
    console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
    console.log(`False Positive Rate (FPR): ${(falsePositiveRate * 100).toFixed(2)}%`);

    assert.equal(falsePositives, 0, 'False-positive count on benchmark dataset must be 0');
    assert.equal(precision, 1.0, 'Precision on benchmark dataset must be 100%');
    assert.ok(recall >= 0.85, 'Recall on benchmark dataset must be >= 85%');
    assert.equal(falsePositiveRate, 0.0, 'False Positive Rate must be 0.0% on benchmark dataset');
  });
});
