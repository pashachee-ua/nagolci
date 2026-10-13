import { renderToString } from 'react-dom/server';
import Portfolio from '../app/portfolio';
import PortfolioV2 from '../app/v2/portfolio';
import type { ContentSnapshot } from '../shared/publication';
const props=(snapshot:ContentSnapshot)=>({content:snapshot.content,imageDimensions:snapshot.imageDimensions,year:new Date(snapshot.createdAt).getUTCFullYear()});
export function renderPortfolio(snapshot:ContentSnapshot):string {
 return renderToString(<Portfolio {...props(snapshot)}/>);
}
/** The /v2/ design: same snapshot and media, separate components and stylesheet. */
export function renderPortfolioV2(snapshot:ContentSnapshot):string {
 return renderToString(<PortfolioV2 {...props(snapshot)}/>);
}
