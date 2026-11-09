// Lets TypeScript import markdown files as strings (angular.json → loader: { ".md": "text" }).
declare module '*.md' {
  const content: string;
  export default content;
}
