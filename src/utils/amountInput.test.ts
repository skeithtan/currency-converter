import assert from "node:assert/strict";
import { test } from "node:test";
import {
  draftToNumber,
  formatDraft,
  getNumberSymbols,
  parseDraft,
  positionAfterSignificant,
  shiftDecimal,
  significantBefore,
} from "./amountInput.ts";

const EN = getNumberSymbols("en-US");
const DE = getNumberSymbols("de-DE");

test("locale separators are read from Intl", () => {
  assert.deepEqual(EN, { group: ",", decimal: "." });
  assert.deepEqual(DE, { group: ".", decimal: "," });
});

test("parseDraft drops grouping and keeps one decimal point", () => {
  assert.equal(parseDraft("1,200,000", EN), "1200000");
  assert.equal(parseDraft("1.200.000", DE), "1200000");
  assert.equal(parseDraft("12.5", EN), "12.5");
  assert.equal(parseDraft("12,5", DE), "12.5");
  assert.equal(parseDraft("12.", EN), "12.");
  assert.equal(parseDraft("1.2.3", EN), "1.23");
  assert.equal(parseDraft(".5", EN), "0.5");
  assert.equal(parseDraft("007", EN), "7");
  assert.equal(parseDraft("0", EN), "0");
  assert.equal(parseDraft("", EN), "");
  assert.equal(parseDraft("abc", EN), "");
});

test("parseDraft accepts Arabic-Indic and Persian digits", () => {
  assert.equal(parseDraft("١٢٣", EN), "123");
  assert.equal(parseDraft("۴۵۶", EN), "456");
});

test("parseDraft caps the number of digits", () => {
  assert.equal(parseDraft("1".repeat(20), EN), "1".repeat(15));
  assert.equal(parseDraft(`1.${"2".repeat(12)}`, EN), `1.${"2".repeat(8)}`);
});

test("formatDraft groups the integer part in the locale's style", () => {
  assert.equal(formatDraft("1200000", EN, "en-US"), "1,200,000");
  assert.equal(formatDraft("1200000", DE, "de-DE"), "1.200.000");
  assert.equal(formatDraft("1200000.5", DE, "de-DE"), "1.200.000,5");
  assert.equal(formatDraft("12.", EN, "en-US"), "12.");
  assert.equal(formatDraft("1200000", EN, "en-IN"), "12,00,000");
  assert.equal(formatDraft("", EN, "en-US"), "");
});

test("shiftDecimal multiplies exactly by powers of ten", () => {
  assert.equal(shiftDecimal("1.2", 6), "1200000");
  assert.equal(shiftDecimal("45", 3), "45000");
  assert.equal(shiftDecimal("1.1", 3), "1100");
  assert.equal(shiftDecimal("0.5", 3), "500");
  assert.equal(shiftDecimal("1.23456", 3), "1234.56");
  assert.equal(shiftDecimal("12.", 3), "12000");
  assert.equal(shiftDecimal("0", 6), "0");
  assert.equal(shiftDecimal("", 3), "");
});

test("shiftDecimal leaves amounts that would grow too large alone", () => {
  assert.equal(shiftDecimal("999999999999", 6), "999999999999");
});

test("draftToNumber reads canonical drafts", () => {
  assert.equal(draftToNumber("1200000"), 1_200_000);
  assert.equal(draftToNumber("12."), 12);
  assert.equal(draftToNumber("0.5"), 0.5);
  assert.equal(draftToNumber(""), undefined);
});

test("the caret keeps its place among digits when regrouping", () => {
  // Typing a fourth digit at the end of "123" regroups to "1,234".
  const typed = "1234";
  const before = significantBefore(typed, 4, EN);
  assert.equal(positionAfterSignificant("1,234", before, EN), 5);

  // Typing "9" after the first digit of "1,234" gives "19,234".
  const inserted = "19,234";
  const count = significantBefore(inserted, 2, EN);
  assert.equal(positionAfterSignificant("19,234", count, EN), 2);

  assert.equal(positionAfterSignificant("1,234", 0, EN), 0);
});
