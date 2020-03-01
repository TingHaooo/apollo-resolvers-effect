import { EffectFn } from '../index'
import { MyContext } from '../testUtils/context'
import { fakePromise } from './fakePromise'

type MyEffect = EffectFn<MyContext>

export const logBeforeAllOperations: MyEffect = async (_p, _v, _c, info) => {
  await fakePromise(() =>
    console.log(`Before all operations effect: ${info.fieldName}`)
  )
}

export const logAfterAllOperations: MyEffect = async (_p, _v, _c, info) => {
  await fakePromise(() =>
    console.log(`After all operations effect: ${info.fieldName}`)
  )
}

export const logBeforeQueryOperations: MyEffect = async (_p, _v, _c, info) => {
  await fakePromise(() =>
    console.log(`Before query operations effect: ${info.fieldName}`)
  )
}

export const logAfterQueryOperations: MyEffect = async (_p, _v, _c, info) => {
  await fakePromise(() =>
    console.log(`After query operations effect: ${info.fieldName}`)
  )
}

export const logBeforeMutationOperations: MyEffect = async (
  _p,
  _v,
  _c,
  info
) => {
  await fakePromise(() =>
    console.log(`Before mutation operations effect: ${info.fieldName}`)
  )
}

export const logAfterMutationOperations: MyEffect = async (
  _p,
  _v,
  _c,
  info
) => {
  await fakePromise(() =>
    console.log(`After mutation operations effect: ${info.fieldName}`)
  )
}

export const logBeforeOperations: MyEffect = async (_p, _v, _c, info) => {
  await fakePromise(() =>
    console.log(`Before operationNames effect: ${info.fieldName}`)
  )
}

export const logAfterOperations: MyEffect = async (_p, _v, _c, info) => {
  await fakePromise(() =>
    console.log(`After operationNames effect: ${info.fieldName}`)
  )
}
