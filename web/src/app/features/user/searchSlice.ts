import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    search: []
}

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setSearch(state, action) {
            state.search = action.payload
        },
        resetSearch(state, action) {
            state.search = []
        }
    }
})

export const { setSearch, resetSearch } = searchSlice.actions
export default searchSlice.reducer