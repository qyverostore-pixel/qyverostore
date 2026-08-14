import { useEffect } from "react";
import { literalTranslations } from "@/i18n/translations";
import { useLocale } from "@/providers/LocaleProvider";

const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;
const ignoredTags = new Set(["SCRIPT", "STYLE", "CODE", "PRE"]);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<
  Element,
  Partial<Record<(typeof ATTRIBUTES)[number], string>>
>();

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Localizes legacy markup without touching existing event handlers or business logic. */
export function LocaleTextBridge() {
  const { language } = useLocale();

  useEffect(() => {
    const dictionary = literalTranslations[language] ?? {};
    const translate = (value: string) => dictionary[clean(value)];
    const localizeElement = (element: Element) => {
      if (element.closest("[data-no-localize]")) return;
      for (const attribute of ATTRIBUTES) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        const originals = originalAttributes.get(element) ?? {};
        const original = originals[attribute] ?? value;
        if (!originals[attribute]) {
          originals[attribute] = value;
          originalAttributes.set(element, originals);
        }
        element.setAttribute(
          attribute,
          language === "en" ? original : (translate(original) ?? original),
        );
      }
      for (const node of Array.from(element.childNodes)) {
        if (!(node instanceof Text) || !node.textContent || !clean(node.textContent))
          continue;
        const original = originalText.get(node) ?? node.textContent;
        if (!originalText.has(node)) originalText.set(node, original);
        const localized = language === "en" ? original : (translate(original) ?? original);
        if (localized !== node.textContent)
          node.textContent = original.replace(original.trim(), localized);
      }
    };
    const localizeTree = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      let current = walker.nextNode() as Element | null;
      while (current) {
        if (!ignoredTags.has(current.tagName)) localizeElement(current);
        current = walker.nextNode() as Element | null;
      }
    };
    localizeTree(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            localizeElement(node);
            localizeTree(node);
          } else if (node.parentElement) localizeElement(node.parentElement);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
