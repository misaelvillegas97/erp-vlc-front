import { Pageable } from './pageable';

export interface Page<T extends object> {
    content: T[];
    pageable: Pageable;
}
