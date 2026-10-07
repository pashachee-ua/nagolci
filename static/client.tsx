import { hydrateRoot } from 'react-dom/client';
import Portfolio from '../app/portfolio';
import type { ContentSnapshot } from '../shared/publication';
import '../app/fonts.css';
import '../app/globals.css';
import '../app/wow.css';
const snapshot=JSON.parse(document.getElementById('site-snapshot')!.textContent!) as ContentSnapshot;
hydrateRoot(document.getElementById('root')!,<Portfolio content={snapshot.content} year={new Date(snapshot.createdAt).getUTCFullYear()}/>);
