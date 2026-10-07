import { renderToString } from 'react-dom/server';
import Portfolio from '../app/portfolio';
import type { ContentSnapshot } from '../shared/publication';
export function renderPortfolio(snapshot:ContentSnapshot):string {
 return renderToString(<Portfolio content={snapshot.content} year={new Date(snapshot.createdAt).getUTCFullYear()}/>);
}
