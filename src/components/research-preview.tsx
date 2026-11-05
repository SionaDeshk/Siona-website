import Link from "next/link";
const sources = [
 {tag:"REVIEW / 2025",title:"How biologics have changed drug discovery",description:"A peer-reviewed overview of how biologic therapeutics have reshaped discovery, development, and protein engineering.",author:"McGonigle, Annual Review of Pharmacology and Toxicology (2025)",url:"https://doi.org/10.1146/annurev-pharmtox-061724-080811"},
 {tag:"REVIEW / 2026",title:"The evolving landscape of drug targets",description:"A review of changing therapeutic modalities and drug targets, including developments in genomics, proteomics, and data science.",author:"Halip et al., Nature Reviews Drug Discovery (2026)",url:"https://www.nature.com/articles/s41573-026-01530-3"},
 {tag:"GUIDANCE / FDA",title:"Continuous manufacturing: scientific and regulatory considerations",description:"FDA/ICH Q13 guidance on developing and managing continuous manufacturing for drug substances and products.",author:"U.S. Food and Drug Administration (2023)",url:"https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q13-continuous-manufacturing-drug-substances-and-drug-products"}
];
export function ResearchPreview(){
 return <section className="research-preview page-gutter" aria-labelledby="research-heading">
  <div className="section-label"><span className="section-number">05 /</span><h2 id="research-heading">Research &amp; perspectives</h2></div>
  <div><p className="research-intro">Grounded in evidence. <em>Open to possibility.</em></p><p className="research-subtitle">Selected independent research and regulatory sources informing our exploration of life sciences. These are third-party publications, not research authored or endorsed by Siona.</p>
  <div className="research-grid">{sources.map(s=><article key={s.url} className="research-item"><span>{s.tag}</span><h3>{s.title}</h3><p>{s.description}</p><small>{s.author}</small><a href={s.url} target="_blank" rel="noopener noreferrer">Read source ↗</a></article>)}</div>
  <Link href="/biologics" className="research-biologics-link">Explore Siona Biologics ↗</Link></div>
 </section>;
}