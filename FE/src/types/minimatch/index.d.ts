declare module "minimatch" {
  export interface IMinimatchOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }

  export class Minimatch {
    constructor(pattern: string, options?: IMinimatchOptions);
    set: string[][];
    regexp: RegExp | false;
    negate: boolean;
    comment: boolean;
    empty: boolean;
    makeRe(): RegExp | false;
    match(f: string): boolean;
  }

  export function minimatch(path: string, pattern: string, options?: IMinimatchOptions): boolean;
  export default minimatch;
}
