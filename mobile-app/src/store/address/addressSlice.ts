import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Address, CreateAddressData, UpdateAddressData, AddressState } from '../../types';
import { addressService } from '../../services/address.service';

// Async Thunks
export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      return await addressService.getAddresses();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }
);

export const fetchAddressById = createAsyncThunk(
  'address/fetchAddressById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await addressService.getAddressById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch address');
    }
  }
);

export const createAddress = createAsyncThunk(
  'address/createAddress',
  async (data: CreateAddressData, { rejectWithValue }) => {
    try {
      return await addressService.createAddress(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create address');
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async ({ id, data }: { id: string; data: UpdateAddressData }, { rejectWithValue }) => {
    try {
      return await addressService.updateAddress(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update address');
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async (id: string, { rejectWithValue }) => {
    try {
      await addressService.deleteAddress(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'address/setDefaultAddress',
  async (id: string, { rejectWithValue }) => {
    try {
      return await addressService.setDefaultAddress(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set default address');
    }
  }
);

const initialState: AddressState = {
  addresses: [],
  selectedAddress: null,
  loading: false,
  error: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    selectAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    logoutUser: (state) => {
      state.addresses = [];
      state.selectedAddress = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Addresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Address By ID
    builder
      .addCase(fetchAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddressById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAddress = action.payload;
      })
      .addCase(fetchAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Address
    builder
      .addCase(createAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.loading = false;
        // If the created address is default, unset default on existing addresses
        if (action.payload?.isDefault) {
          state.addresses = state.addresses.map((a) => ({ ...a, isDefault: false }));
        }
        state.addresses.push(action.payload);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Address
    builder
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.addresses.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
        if (state.selectedAddress?.id === action.payload.id) {
          state.selectedAddress = action.payload;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Address
    builder
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter((a) => a.id !== action.payload);
        if (state.selectedAddress?.id === action.payload) {
          state.selectedAddress = null;
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Set Default Address
    builder
      .addCase(setDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;
        // Update the addresses list
        state.addresses = state.addresses.map((a) => ({
          ...a,
          isDefault: a.id === action.payload.id,
        }));
        state.selectedAddress = action.payload;
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, selectAddress, logoutUser } = addressSlice.actions;

// Selectors
export const selectAddresses = (state: any) => state.address.addresses;
export const selectSelectedAddress = (state: any) => state.address.selectedAddress;
export const selectAddressLoading = (state: any) => state.address.loading;
export const selectAddressError = (state: any) => state.address.error;
export const selectDefaultAddress = (state: any) =>
  state.address.addresses.find((a: Address) => a.isDefault);

export default addressSlice.reducer;
