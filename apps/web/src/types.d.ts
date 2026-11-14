// Lets TypeScript import markdown files as strings (angular.json → loader: { ".md": "text" }).
declare module '*.md' {
  const content: string;
  export default content;
}

// The resume HTML is indexed by the chat agent as text (angular.json → loader: { ".html": "text" }).
declare module '*.html' {
  const content: string;
  export default content;
}
