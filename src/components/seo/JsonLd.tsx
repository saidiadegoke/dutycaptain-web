/**
 * Structured data for search engines. Rendered as a script tag; `<` is escaped
 * so no value in the data can close the tag early.
 */
export function JsonLd({ data }: {data: Record<string, unknown>;}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />);


}
