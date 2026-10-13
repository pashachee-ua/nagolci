import { hydrateRoot } from 'react-dom/client';
import Portfolio from '../../app/v2/portfolio';
import type { ContentSnapshot } from '../../shared/publication';
import '../../app/v2/fonts.css';
import '../../app/v2/globals.css';
import '../../app/v2/wow.css';
import '../../app/v2/v2.css';
const snapshot=JSON.parse(document.getElementById('site-snapshot')!.textContent!) as ContentSnapshot;
hydrateRoot(document.getElementById('root')!,<Portfolio content={snapshot.content} imageDimensions={snapshot.imageDimensions} year={new Date(snapshot.createdAt).getUTCFullYear()}/>);
