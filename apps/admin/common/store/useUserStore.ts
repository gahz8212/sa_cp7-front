"use client"

import { create, StoreApi } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type UserInfoType = {
  aprvSttsCd: string
}

export type UserInfoTypes = UserInfoType | null

export type UserInfoEntriesTypes = [keyof UserInfoType, UserInfoType[keyof UserInfoType]][]

export interface UserStateTypes {
  userInfo: UserInfoTypes
  setStoreUserInfo: (userInfo: UserInfoTypes) => void
  clearUserInfo: () => void
}

// 설정: devtools
const devtoolsOptions = {
  name: "UserStore",
}

// 설정: persistOptions
const persistOptions = {
  name: "user-storage",
  partialize: (state: UserStateTypes) => ({
    userInfo: state.userInfo,
  }),
}

type SetState = StoreApi<UserStateTypes>["setState"]

// 액션: 사용자 데이터 설정
const createSetStoreUserInfo = (set: SetState) => (userInfo: UserInfoTypes) => {
  set({ userInfo })
}

// 액션: 사용자 데이터 초기화
const createClearUserData = (set: SetState) => () => {
  set({ userInfo: null })
}

export const useUserStore = create<UserStateTypes>()(
  devtools(
    persist(
      (set) => ({
        userInfo: null,
        setStoreUserInfo: createSetStoreUserInfo(set),
        clearUserInfo: createClearUserData(set),
      }),
      { ...persistOptions },
    ),
    { ...devtoolsOptions },
  ),
)
