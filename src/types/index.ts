type PrefixedId<Prefix extends string> = `${Prefix}_${string}`;

export type BaseEntity<Prefix extends string> = {
    id: PrefixedId<Prefix>
    name: string;
    tags: string[];
    custom: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

interface Person extends BaseEntity<'p'> {
    kind: "person"; //disjoint union
    dob: string | undefined;
    email: string | null;
}

type Company = BaseEntity<'c'> & {
    kind: "company",
    domain: string | undefined,
    foundedAt: string,
}
export type Entity = Person | Company

export type Note = {
    id: PrefixedId<'n'>,
    subjectKind: string,
    subjectId: string,
    text: string,
    createdAt: string
}
export type Deal = {
    id: PrefixedId<'d'>,
    title: string,
    stage: string,
    amount: number,
    //ownerId: string <-- too wide
    //ownerId:  PrefixedId<'p'>  <-- better, but the best:
    ownerId: Person['id'], //shows relations between entities
    contactIds: Person['id'][],
    createdAt: string,
    updatedAt: string,
}
