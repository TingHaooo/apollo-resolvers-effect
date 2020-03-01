import { GraphQLResolveInfo } from 'graphql'

export type EffectFn<TContext, TArgs = any> = (
  parent: any,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => void

export type EffectType = 'All' | 'Mutation' | 'Query'

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

type operationNames<TQueryResolvers, TMutationResolvers> = (
  | keyof TQueryResolvers
  | keyof TMutationResolvers
)[]

interface EffectI<TQueryResolvers, TMutationResolvers, TContext> {
  beforeEffects?: EffectFn<TContext>[]
  afterEffects?: EffectFn<TContext>[]
  type: EffectType
  operationNames: operationNames<TQueryResolvers, TMutationResolvers>
}

export type Effect<
  TQueryResolvers,
  TMutationResolvers,
  TContext
> = RequireAtLeastOne<
  EffectI<TQueryResolvers, TMutationResolvers, TContext>,
  'type' | 'operationNames'
>

type OperationEffects<TQueryResolvers, TMutationResolvers, TContext> = {
  [key in keyof TQueryResolvers | keyof TMutationResolvers]: {
    beforeEffects: EffectFn<TContext>[]
    afterEffects: EffectFn<TContext>[]
  }
}

interface AddEffectArgs<TContext> {
  resolverFn: EffectFn<TContext>
  beforeEffects: EffectFn<TContext>[]
  afterEffects: EffectFn<TContext>[]
  effectErrorHandler?: (e: any) => void
}

interface WithEffectArgs<TQueryResolvers, TMutationResolvers, TContext> {
  resolvers: any
  effects: Effect<TQueryResolvers, TMutationResolvers, TContext>[]
  effectErrorHandler?: (e: any) => void
}

const addEffect = <TContext>({
  resolverFn,
  beforeEffects,
  afterEffects,
  effectErrorHandler
}: AddEffectArgs<TContext>) => {
  return async (parent, args, context, info) => {
    try {
      for (const fn of beforeEffects) {
        await fn(parent, args, context, info)
      }
      const res = await resolverFn(parent, args, context, info)
      for (const fn of afterEffects) {
        await fn(parent, args, context, info)
      }
      return res
    } catch (e) {
      if (effectErrorHandler) {
        effectErrorHandler(e)
      } else {
        throw e
      }
    }
  }
}

const withEffect = <TQueryResolvers, TMutationResolvers, TContext>({
  resolvers,
  effects,
  effectErrorHandler
}: WithEffectArgs<TQueryResolvers, TMutationResolvers, TContext>) => {
  const typeEffects: Effect<
    TQueryResolvers,
    TMutationResolvers,
    TContext
  >[] = []
  for (const effect of effects) {
    if (effect.type === 'All') {
      for (const key in resolvers.Query) {
        const mutationEffect = {
          operationNames: [key],
          beforeEffects: effect.beforeEffects,
          afterEffects: effect.afterEffects
        }
        typeEffects.push(mutationEffect as any)
      }

      for (const key in resolvers.Mutation) {
        const mutationEffect = {
          operationNames: [key],
          beforeEffects: effect.beforeEffects,
          afterEffects: effect.afterEffects
        }
        typeEffects.push(mutationEffect as any)
      }
    }
    if (effect.type === 'Query') {
      for (const key in resolvers.Query) {
        const mutationEffect = {
          operationNames: [key],
          beforeEffects: effect.beforeEffects,
          afterEffects: effect.afterEffects
        }
        typeEffects.push(mutationEffect as any)
      }
    }

    if (effect.type === 'Mutation') {
      for (const key in resolvers.Mutation) {
        const mutationEffect = {
          operationNames: [key],
          beforeEffects: effect.beforeEffects,
          afterEffects: effect.afterEffects
        }
        typeEffects.push(mutationEffect as any)
      }
    }
  }

  const extenedEffects = [
    ...typeEffects,
    ...effects.filter(effect => !effect.type)
  ]

  const operationEffects = {} as OperationEffects<
    TQueryResolvers,
    TMutationResolvers,
    TContext
  >

  extenedEffects.forEach(effect => {
    if (effect.operationNames) {
      for (const operationName of effect.operationNames) {
        if (!operationEffects[operationName]) {
          operationEffects[operationName] = {
            beforeEffects: effect.beforeEffects
              ? [...effect.beforeEffects]
              : [],
            afterEffects: effect.afterEffects ? [...effect.afterEffects] : []
          }
        } else {
          if (effect.beforeEffects) {
            operationEffects[operationName].beforeEffects.push(
              ...effect.beforeEffects
            )
          }
          if (effect.afterEffects) {
            operationEffects[operationName].afterEffects.push(
              ...effect.afterEffects
            )
          }
        }
      }
    }
  })

  for (const operationName in operationEffects) {
    if (resolvers?.Mutation[operationName]) {
      resolvers.Mutation[operationName] = addEffect({
        resolverFn: resolvers.Mutation[operationName],
        beforeEffects: operationEffects[operationName].beforeEffects,
        afterEffects: operationEffects[operationName].afterEffects,
        effectErrorHandler
      })
    }

    if (resolvers?.Query[operationName]) {
      resolvers.Query[operationName] = addEffect({
        resolverFn: resolvers.Query[operationName],
        beforeEffects: operationEffects[operationName].beforeEffects,
        afterEffects: operationEffects[operationName].afterEffects,
        effectErrorHandler
      })
    }
  }
  return resolvers
}

export { withEffect }
