import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk for fetching user data
export const fetchUserData = createAsyncThunk(
	"user/fetchUserData",
	async (userId) => {
		const response = await fetch(`/api/users/${userId}`);
		return response.json();
	},
);

const userSlice = createSlice({
	name: "user",
	initialState: {
		user: null,
		loading: false,
		error: null,
	},
	reducers: {
		setUser: (state, action) => {
			state.user = action.payload;
		},
		clearUser: (state) => {
			state.user = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUserData.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchUserData.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
			})
			.addCase(fetchUserData.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message;
			});
	},
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
