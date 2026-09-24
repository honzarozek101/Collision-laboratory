// Seznam kolizních systémů. Nový systém přidáš vytvořením souboru
// se stejným rozhraním (create → add / step / read / dispose) a zapsáním sem.
import rapier from './rapier.js';
import cannon from './cannon.js';
import octree from './octree.js';
import custom from './custom.js';

export const ENGINES = { rapier, cannon, octree, custom };
