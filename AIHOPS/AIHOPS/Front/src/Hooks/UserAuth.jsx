import {AuthContext} from '../context/AuthContext';
import {useContext} from 'react';

export const useUserAuth = () => {
   const context = useContext(AuthContext);

   if (!context) {
      throw new Error('useUserAuth must be used within an AuthProvider');
   }

   return context;
}