import { Observable } from 'rxjs/Observable'
import { OperatorFunction } from 'rxjs/interfaces'
import { combineAll } from 'rxjs/operators/combineAll'
import { map } from 'rxjs/operators/map'
import { publishReplay } from 'rxjs/operators/publishReplay'
import { refCount } from 'rxjs/operators/refCount'
import { skipWhile } from 'rxjs/operators/skipWhile'
import { switchMap } from 'rxjs/operators/switchMap'
import { take } from 'rxjs/operators/take'
import { tap } from 'rxjs/operators/tap'
import { Selector } from './Selector'
import { ProxySelector } from './ProxySelector'
import { assert } from '../../utils/assert'
import { TokenConsumed } from '../../exception/token'
// import { patch } from '../../utils/patch'
import { Ops } from '../../utils/diff'

export type SelectorMeta<T> = Selector<T> | ProxySelector<T>

const skipWhileProxySelector =
  skipWhile(v => v instanceof ProxySelector) as <T>(x: Observable<SelectorMeta<T>>) => Observable<Selector<T>>

export class QueryToken<T> {
  selector$: Observable<SelectorMeta<T>>

  private consumed = false

  constructor(selector$: Observable<SelectorMeta<T>>) {
    this.selector$ = selector$.pipe(
      publishReplay(1),
      refCount()
    )
  }

  map<K>(fn: OperatorFunction<T[], K[]>) {
    this.selector$ = this.selector$.pipe(
      tap(selector => (selector as any).map(fn))
    )
    return this as any as QueryToken<K>
  }

  values(): Observable<T[]> {
    assert(!this.consumed, TokenConsumed())

    this.consumed = true
    return this.selector$.pipe(
      switchMap(s => s.values()),
      take(1)
    )
  }

  changes(): Observable<T[]> {
    assert(!this.consumed, TokenConsumed())

    this.consumed = true
    return this.selector$.pipe(
      switchMap(s => s.changes())
    )
  }

  changesWithOps(pk?: string): Observable<{ result: T[], ops: Ops}> {
    assert(!this.consumed, TokenConsumed())

    this.consumed = true
    return this.selector$.pipe(
      switchMap((s) => s.changesWithOps(pk)),
    )
  }

  concat(...tokens: QueryToken<T>[]) {
    tokens.unshift(this)
    const newSelector$ = Observable.from(tokens).pipe(
      map(token => token.selector$.pipe(skipWhileProxySelector)),
      combineAll<Observable<Selector<T>>, Selector<T>[]>(),
      map((r) => {
        const first = r.shift()
        return first!.concat(...r)
      })
    )
    return new QueryToken<T>(newSelector$)
  }

  combine(...tokens: QueryToken<any>[]) {
    tokens.unshift(this)
    const newSelector$ = Observable.from(tokens).pipe(
      map(token => token.selector$.pipe(skipWhileProxySelector)),
      combineAll<Observable<Selector<T>>, Selector<T>[]>(),
      map((r) => {
        const first = r.shift()
        return first!.combine(...r)
      })
    )
    return new QueryToken<T>(newSelector$)
  }

  toString() {
    return this.selector$.pipe(map(r => r.toString()))
  }
}
