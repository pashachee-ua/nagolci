import { renderToString } from 'react-dom/server';
import Portfolio from '../app/portfolio';
import type { ContentSnapshot } from '../shared/publication';
export function renderPortfolio(snapshot:ContentSnapshot):string {
 return renderToString(<Portfolio content={snapshot.content} imageDimensions={snapshot.imageDimensions} imageVariants={snapshot.imageVariants} year={new Date(snapshot.createdAt).getUTCFullYear()}/>);
}
