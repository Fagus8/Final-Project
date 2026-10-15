import 'swagger-ui-react/swagger-ui.css';
import './swagger-dark.scss';

// Swagger-ის სტილები მხოლოდ /docs გვერდზე იტვირთება, სხვა გვერდებს არ ეხება
export default function ApiDocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
