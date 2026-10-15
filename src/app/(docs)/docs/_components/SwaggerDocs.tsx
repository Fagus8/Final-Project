'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

// API დოკუმენტაციის გვერდი (Swagger UI), ინტერფეისის ტექსტები ქართულად

// Swagger UI მხოლოდ ბრაუზერში მუშაობს, ამიტომ სერვერზე არ იხატება
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

// Swagger-ს ქართული ენა არ აქვს. ინგლისური ტექსტი → ქართული თარგმანი
const translations: Record<string, string> = {
  'Servers': 'სერვერები',
  'Authorize': 'ავტორიზაცია',
  'Available authorizations': 'ხელმისაწვდომი ავტორიზაციები',
  'Filter by tag': 'ტეგით გაფილტვრა',
  'Try it out': 'საცდელად გაშვება',
  'Cancel': 'გაუქმება',
  'Execute': 'შესრულება',
  'Clear': 'გასუფთავება',
  'Reset': 'აღდგენა',
  'Parameters': 'პარამეტრები',
  'No parameters': 'პარამეტრები არ არის',
  'Request body': 'მოთხოვნის ტანი',
  'Responses': 'პასუხები',
  'Response content type': 'პასუხის შიგთავსის ტიპი',
  'Request content type': 'მოთხოვნის შიგთავსის ტიპი',
  'Example Value': 'მაგალითი',
  'Edit Value': 'მნიშვნელობის რედაქტირება',
  'Schema': 'სქემა',
  'Model': 'მოდელი',
  'Code': 'კოდი',
  'Description': 'აღწერა',
  'Links': 'ბმულები',
  'No links': 'ბმულები არ არის',
  'Request URL': 'მოთხოვნის URL',
  'Server response': 'სერვერის პასუხი',
  'Response body': 'პასუხის ტანი',
  'Response headers': 'პასუხის სათაურები',
  'Headers': 'სათაურები',
  'Name': 'სახელი',
  'Name:': 'სახელი:',
  'Value': 'მნიშვნელობა',
  'Value:': 'მნიშვნელობა:',
  'In:': 'მდებარეობა:',
  'required': 'სავალდებულო',
  'optional': 'არასავალდებულო',
  'Close': 'დახურვა',
  'Apply credentials': 'ავტორიზაციის მონაცემების გამოყენება',
  'Copy path to clipboard': 'ბილიკის კოპირება',
  'Copy to clipboard': 'კოპირება',
  'Copied!': 'დაკოპირდა!',
  'Download': 'ჩამოტვირთვა',
  'Collapse operation': 'ოპერაციის დაკეცვა',
  'Expand operation': 'ოპერაციის გაშლა',
  'Collapse tag': 'ჯგუფის დაკეცვა',
  'Expand tag': 'ჯგუფის გაშლა',
  'authorization button unlocked': 'ავტორიზაცია ჩართულია',
  'authorization button locked': 'ავტორიზაცია გამორთულია',
  'No operations defined in spec!': 'სპეციფიკაციაში ოპერაციები განსაზღვრული არ არის.',
  'Search': 'ძიება',
  'Show': 'ჩვენება',
  'Hide': 'დამალვა',
  'Deprecated': 'მოძველებულია',
  'Read only': 'მხოლოდ წაკითხვა',
  'write only': 'მხოლოდ ჩაწერა',
  'Media type': 'მედიის ტიპი',
  'Content type': 'შიგთავსის ტიპი',
  'Request samples': 'მოთხოვნის მაგალითები',
  'Response samples': 'პასუხის მაგალითები',
  'One of': 'ერთ-ერთი',
  'Default': 'ნაგულისხმევი',
  'Example': 'მაგალითი',
  'Minimum': 'მინიმუმი',
  'Maximum': 'მაქსიმუმი',
  'Min length': 'მინიმალური სიგრძე',
  'Max length': 'მაქსიმალური სიგრძე',
  'Format': 'ფორმატი',
  'Enum': 'დასაშვები მნიშვნელობები',
  'Pattern': 'შაბლონი',
  'Loading...': 'იტვირთება...',
  'Failed to load API definition.': 'API სპეციფიკაციის ჩატვირთვა ვერ მოხერხდა.',
  'Expand all': 'ყველას გაშლა',
  'Collapse all': 'ყველას დაკეცვა',
  'string': 'ტექსტი',
  'integer': 'მთელი რიცხვი',
  'number': 'რიცხვი',
  'boolean': 'ლოგიკური მნიშვნელობა',
  'array': 'მასივი',
  'object': 'ობიექტი',
};

// ატრიბუტები, რომლებშიც ტექსტი მომხმარებელს უჩანს (მინიშნებები, placeholder)
const translatableAttributes = ['aria-label', 'title', 'placeholder'];

export default function SwaggerDocs() {
  const docsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const docs = docsRef.current;
    if (!docs) return;

    // ერთი ტექსტური კვანძის თარგმნა. კოდის ბლოკებს და ველებს არ ვეხებით,
    // თორემ API-ს მაგალითებიც ითარგმნებოდა
    const translateText = (node: Node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return;
      if (node.parentElement?.closest('code, pre, textarea')) return;

      const text = node.textContent;
      const trimmed = text.trim();
      const translation = translations[trimmed];
      if (translation) {
        // სიტყვის გარშემო არსებულ ცარიელ ადგილებს ვინარჩუნებთ
        const start = text.indexOf(trimmed);
        node.textContent = `${text.slice(0, start)}${translation}${text.slice(start + trimmed.length)}`;
      }
    };

    const translateAttributes = (element: Element) => {
      for (const attribute of translatableAttributes) {
        const value = element.getAttribute(attribute);
        const translation = value && translations[value];
        if (translation) element.setAttribute(attribute, translation);
      }
    };

    // ელემენტი და მთელი მისი შიგთავსი (რეკურსიულად)
    const translateSubtree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        translateText(node);
        return;
      }

      if (node instanceof Element) translateAttributes(node);
      node.childNodes.forEach(translateSubtree);
    };

    translateSubtree(docs);

    // Swagger ტექსტს მოგვიანებითაც ამატებს (გაშლისას, პასუხის მოსვლისას),
    // ამიტომ ცვლილებებს ვაკვირდებით და ახალ ტექსტსაც ვთარგმნით
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') {
          translateText(record.target);
        } else if (record.type === 'attributes' && record.target instanceof Element) {
          translateAttributes(record.target);
        } else {
          record.addedNodes.forEach(translateSubtree);
        }
      }
    });

    observer.observe(docs, {
      attributes: true,
      attributeFilter: translatableAttributes,
      characterData: true,
      childList: true,
      subtree: true,
    });

    // გვერდიდან გასვლისას დაკვირვებას ვწყვეტთ
    return () => observer.disconnect();
  }, []);

  return (
    <main className="api-docs" ref={docsRef}>
      {/* API-ს აღწერას /api/openapi აბრუნებს */}
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={-1}
        displayRequestDuration
        filter
        persistAuthorization
        withCredentials
      />
    </main>
  );
}
