import { Observable } from 'rxjs/Observable'
import { PartialObserver } from 'rxjs/Observer'
import { RDBType, Relationship, LeafType, StatementType, JoinMode, DataStoreType } from './enum'

export type DeepPartial<T> = {
  [K in keyof T]?: Partial<T[K]>
}

export type RelationshipPredicate<T> = {
  [P in keyof T]?: lf.schema.Column
}

export interface SchemaMetadata<T> {
  type: RDBType | Relationship
  primaryKey?: boolean
  index?: boolean
  unique?: boolean
  /**
   * ref to other table
   * 这里需要定义表名，字段和查询条件
   */
  virtual?: {
    name: string
    where<U>(ref: TableShape<U>): RelationshipPredicate<T>
  }
}

export type TableShape<T> = lf.schema.Table & {
  [P in keyof T]: lf.schema.Column
}

export type SchemaDef<T> = {
  [P in keyof T]: SchemaMetadata<T>
} & {
  dispose?: SchemaDisposeFunction<T>
  ['@@dispose']?: SchemaDisposeFunction<T>
}

export interface Association {
  name: string
  type?: Relationship
  where(targetTable: lf.schema.Table): lf.Predicate
}

export interface ColumnDef {
  column: string
  id: boolean
  type?: string
}

export interface ParsedSchema {
  associations: Map<string, Association>
  mapper: Map<string, Function>
  columns: Map<string, RDBType>
  dispose?: SchemaDisposeFunction<any>
  pk: string
}

export type Field = string | { [index: string]: Field[] }

export interface Clause<T> {
  where?: Predicate<T>
}

export interface OrderDescription {
  fieldName: string
  orderBy?: 'DESC' | 'ASC'
}

export interface Query<T> extends Clause<T> {
  fields?: Field[]
  limit?: number
  skip?: number
  orderBy?: OrderDescription[]
}

export interface JoinInfo {
  table: lf.schema.Table,
  predicate: lf.Predicate
}

export interface Record {
  [property: string]: number
}

export interface ExecutorResult {
  result: boolean
  insert: number
  delete: number
  update: number
}

export interface TraverseContext {
  skip: () => void
  type: () => string
  isLeaf: boolean
  path: string[]
  parent: any
  children: any[]
  key: string
  node: any
  isRoot: boolean
  index: number
}

export interface UpsertContext {
  mapper: Function | null
  isNavigatorLeaf: boolean,
  visited: boolean,
}

export interface SelectContext {
  type: LeafType
  leaf: ColumnLeaf | NavigatorLeaf | null
}

export interface ColumnLeaf {
  column: lf.schema.Column
  identifier: string
}

export interface NavigatorLeaf {
  fields: Array<Field> | Set<Field>
  containKey: boolean
  assocaiation: Association
}

export type ScopedHandler = [
  (where?: Predicate<any>) => Observable<any>,
  (ret: any[]) => void
]

export type SchemaDisposeFunction<T> =
  (entities: Partial<T>[], scopedHandler: (name: string) => ScopedHandler) => Observable<Partial<T>>

export interface ShapeMatcher {
  mainTable: lf.schema.Table
  pk: {
    name: string,
    queried: boolean
  }
  definition: Object
}

export interface OrderInfo {
  column: lf.schema.Column
  orderBy: lf.Order | null
}

export interface LfFactoryInit {
  storeType: DataStoreType
  enableInspector: boolean
}

export type ValueLiteral = string | number | boolean
export type VaildEqType = ValueLiteral | lf.schema.Column | lf.Binder

export interface PredicateMeta<T> {
  $ne: ValueLiteral
  $eq: ValueLiteral
  $and: Predicate<T>
  $or: Predicate<T> | Predicate<T>[]
  $not: Predicate<T>
  $lt: ValueLiteral
  $lte: ValueLiteral
  $gt: ValueLiteral
  $gte: ValueLiteral
  $match: RegExp
  $notMatch: RegExp
  $has: ValueLiteral
  $between: [ number, number ]
  $in: ValueLiteral[]
  $isNull: boolean
  $isNotNull: boolean
}

export type Predicate<T> = Partial<{
  [P in keyof T]:
    | Partial<PredicateMeta<T[P]>> // 操作符表达式，如 { $or: [{ $gt: 1 }, { $lt: 5 }] }
    | ValueLiteral                 // 字面量值
    | String                       // 一种特殊的字面量值类型，常用 interface X extends String { kind?: 'x' } 表达
  }
  & PredicateMeta<T>
>

export { StatementType, JoinMode, LeafType, Relationship, DataStoreType, RDBType }

export type TransactionDescriptor<T> = {
  [P in keyof T]: PropertyDescriptor
}

export type TransactionHandler = {
  commit: () => Observable<ExecutorResult>
  abort: () => void
}

export type Transaction<T> = [T, TransactionHandler]

export type TransactionEffects<T = any> = PartialObserver<T> | { next: (x: T) => void, error?: (e: any) => void, complete?: () => void }
