import insforge from './insforge';

/**
 * InsForge API Wrapper
 * This file replaces all backend calls previously made to main.py
 */

// --- AUTH ---

export const loginUser = async (email: string, password: string) => {
  let { data, error } = await insforge.auth.signInWithPassword({
    email,
    password,
  });

  // Auto-provision default admin if they don't exist yet
  if (error && email === 'systemadmin.qr@insforge.com') {
    console.log('Admin login failed, attempting auto-provision...');
    const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
      email,
      password,
    });
    
    console.log('Signup result:', { signUpData, signUpError });
    
    if (signUpError) {
      console.error('Auto-signup failed:', signUpError);
      throw signUpError;
    }
    
    if (signUpData.user) {
      // Create the admin profile automatically
      const { error: profileError } = await insforge.database.from('profiles').insert([{
        id: signUpData.user.id,
        username: 'admin',
        full_name: 'Super Admin',
        role: 'admin',
        status: 'Active'
      }]);
      
      console.log('Profile creation:', profileError);

      if (profileError) {
         // Even if profile fails (maybe existing), try to login
         console.warn('Profile insert error:', profileError);
      }
      
      // Retry login
      const retry = await insforge.auth.signInWithPassword({ email, password });
      console.log('Retry login result:', retry);
      if (!retry.error) {
        data = retry.data;
        error = null;
      } else {
        error = retry.error;
      }
    }
  }

  if (error) throw error;

  // Fetch profiles table to get additional user data
  const { data: profile, error: profileError } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw profileError;

  return { ...data.user, ...profile };
};

export const signupUser = async (signupData: any) => {
  const { email, password, username, student_id, full_name, phone } = signupData;

  // 1. Create Auth User
  const { data: authData, error: authError } = await insforge.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. Create Profile entry
  const assignedRole = email.endsWith('@gmail.com') ? 'admin' : 'student';

  const { error: profileError } = await insforge.database.from('profiles').insert([
    {
      id: authData.user?.id,
      username,
      student_id,
      full_name,
      phone,
      role: assignedRole,
      status: 'Active',
    },
  ]);

  if (profileError) throw profileError;

  return authData;
};

export const getMe = async () => {
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  if (userError || !userData?.user) return null;

  const { data: profile, error: profileError } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (profileError) return { ...userData.user };

  return { ...userData.user, ...profile };
};

export const logoutUser = async () => {
  return await insforge.auth.signOut();
};

// --- DATA ---

export const getPayments = async (studentId: string) => {
  const { data, error } = await insforge.database
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const makePayment = async (studentId: string, amount: number, mode: string) => {
  const date = new Date().toISOString().split('T')[0];

  // 1. Record Payment
  const { data: paymentData, error: paymentError } = await insforge.database
    .from('payments')
    .insert([
      { student_id: studentId, amount, date, mode, status: 'Success' },
    ])
    .select()
    .single();

  if (paymentError) throw paymentError;

  // 2. Update Profile (Paid Amount)
  // Note: In a production app, this should ideally be handled by a DB trigger/function
  // for atomic updates to avoid race conditions.
  const { data: currentProfile } = await insforge.database
    .from('profiles')
    .select('paid_amount')
    .eq('student_id', studentId)
    .single();

  const newPaidAmount = (currentProfile?.paid_amount || 0) + amount;

  const { error: updateError } = await insforge.database
    .from('profiles')
    .update({ paid_amount: newPaidAmount })
    .eq('student_id', studentId);

  if (updateError) throw updateError;

  return paymentData;
};

export const getNotifications = async (studentId: string) => {
  const { data, error } = await insforge.database
    .from('notifications')
    .select('*')
    .or(`student_id.eq.${studentId},student_id.is.null`)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const mealAccess = async (studentId: string, mealType: string) => {
  const date = new Date().toISOString().split('T')[0];

  // 1. Check if profile exists and fee status
  const { data: profile, error: profileError } = await insforge.database
    .from('profiles')
    .select('paid_amount, total_fees, status')
    .eq('student_id', studentId)
    .single();

  if (profileError || !profile) throw new Error('Student profile not found');
  if (profile.status !== 'Active') throw new Error('Student account is not active');
  
  if (Number(profile.paid_amount) < Number(profile.total_fees) * 0.5) {
    throw new Error('Access denied. Minimum 50% fee payment required.');
  }

  // 2. Check if already taken
  const { data: existing } = await insforge.database
    .from('meal_records')
    .select('id')
    .eq('student_id', studentId)
    .eq('meal_type', mealType)
    .eq('date', date)
    .maybeSingle();

  if (existing) throw new Error(`Already taken ${mealType} today`);

  // 3. Record Meal
  const { data, error } = await insforge.database.from('meal_records').insert([
    { student_id: studentId, meal_type: mealType, date },
  ]).select().single();

  if (error) throw error;
  return data;
};

export const getMealLogs = async (studentId: string) => {
  const { data, error } = await insforge.database
    .from('meal_records')
    .select('*')
    .eq('student_id', studentId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
};

export const getMenu = async () => {
  const { data, error } = await insforge.database.from('menu').select('*');
  if (error) throw error;
  return data;
};

export const updateMenu = async (id: string | number, menuData: any) => {
  // If id is a string (day name), upsert for auto-initialization
  if (typeof id === 'string' && isNaN(Number(id))) {
    const { error } = await insforge.database
      .from('menu')
      .upsert(menuData, { onConflict: 'day' });
    if (error) throw error;
    return { success: true };
  }
  const { error } = await insforge.database
    .from('menu')
    .update(menuData)
    .eq('id', id);
  if (error) throw error;
  return { success: true };
};

export const getRooms = async () => {
  const { data: rooms, error: roomsError } = await insforge.database.from('rooms').select('*');
  if (roomsError) throw roomsError;

  const { data: profiles, error: profilesError } = await insforge.database
    .from('profiles')
    .select('room_number')
    .eq('role', 'student');
  
  if (profilesError) throw profilesError;

  // Calculate occupancy locally for now
  return rooms.map((room: any) => ({
    ...room,
    occupancy: profiles.filter((p: any) => p.room_number === room.room_number).length
  }));
};

export const addRoom = async (roomData: any) => {
  const { error } = await insforge.database.from('rooms').insert([roomData]);
  if (error) throw error;
  return { success: true };
};

export const updateRoom = async (id: string | number, roomData: any) => {
  const { error } = await insforge.database
    .from('rooms')
    .update(roomData)
    .eq('id', id);
  if (error) throw error;
  return { success: true };
};

export const deleteRoom = async (id: string | number) => {
  const { error } = await insforge.database
    .from('rooms')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
};

export const getRoomStudents = async (roomNumber: string) => {
  const { data, error } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('room_number', roomNumber);
  
  if (error) throw error;
  return data;
};

export const getRules = async () => {
  const { data, error } = await insforge.database.from('rules').select('*');
  if (error) throw error;
  return data;
};

export const addRule = async (ruleData: any) => {
  const { error } = await insforge.database.from('rules').insert([ruleData]);
  if (error) throw error;
  return { success: true };
};

export const updateRule = async (id: string | number, updates: any) => {
  const { error } = await insforge.database
    .from('rules')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return { success: true };
};

export const deleteRule = async (id: string | number) => {
  const { error } = await insforge.database
    .from('rules')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
};

export const getMealStats = async () => {
  const { data, error } = await insforge.database
    .from('meal_records')
    .select('date');
  
  if (error) throw error;

  const counts: Record<string, number> = {};
  data.forEach((r: any) => {
    counts[r.date] = (counts[r.date] || 0) + 1;
  });

  return Object.entries(counts).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
};

export const getRevenueStats = async () => {
  const { data, error } = await insforge.database
    .from('payments')
    .select('date, amount');
  
  if (error) throw error;

  const revenue: Record<string, number> = {};
  data.forEach((p: any) => {
    revenue[p.date] = (revenue[p.date] || 0) + Number(p.amount);
  });

  return Object.entries(revenue).map(([date, total]) => ({ date, total })).sort((a,b) => a.date.localeCompare(b.date));
};

// --- ADMIN ---

export const getAdminStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  const [{ data: profiles }, { data: payments }, { data: mealRecords }, { data: rooms }] = await Promise.all([
    insforge.database.from('profiles').select('status, total_fees, paid_amount').eq('role', 'student'),
    insforge.database.from('payments').select('amount'),
    insforge.database.from('meal_records').select('meal_type').eq('date', today),
    insforge.database.from('rooms').select('room_number, capacity')
  ]);

  const totalStudents = profiles?.length || 0;
  const activeStudents = profiles?.filter(p => p.status === 'Active').length || 0;
  const totalReceived = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const totalFees = profiles?.reduce((acc, curr) => acc + Number(curr.total_fees || 0), 0) || 0;
  const paidAmount = profiles?.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0) || 0;
  
  const mealCounts = { Breakfast: 0, Lunch: 0, Dinner: 0 };
  mealRecords?.forEach((r: any) => {
    if (r.meal_type in mealCounts) {
      mealCounts[r.meal_type as keyof typeof mealCounts]++;
    }
  });

  return {
    students: { 
      total: totalStudents, 
      active: activeStudents, 
      blocked: totalStudents - activeStudents 
    },
    payments: { 
      total_received: totalReceived, 
      pending: totalFees - paidAmount 
    },
    rooms: {
      total: rooms?.length || 0,
      occupied: profiles?.filter(p => (p as any).room_number).length || 0, // This is a rough estimate
      available: (rooms?.reduce((acc, r) => acc + r.capacity, 0) || 0) - (profiles?.filter(p => (p as any).room_number).length || 0)
    },
    today_meals: mealCounts
  };
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  throw new Error('Direct password updates in InsForge require the reset-password flow. Please log out and click "Forgot Password".');
};

export const updateProfile = async (profileData: any) => {
  const { userId, ...updates } = profileData;
  const { data, error } = await insforge.database
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStudent = async (studentId: string | number) => {
  // In a real app with Auth, you might need to handle the auth user deletion too
  // For now, we delete the profile row
  const { error } = await insforge.database
    .from('profiles')
    .delete()
    .eq('id', studentId);
    
  if (error) throw error;
  return { success: true };
};

export const updateStudentStatus = async (studentId: string, status: string) => {
  const { error } = await insforge.database
    .from('profiles')
    .update({ status })
    .eq('student_id', studentId);

  if (error) throw error;
  return { success: true };
};

export const updateStudent = async (id: string, updates: any) => {
  const { error } = await insforge.database
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};
export const getAllStudents = async () => {
  const { data, error } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('role', 'student');

  if (error) throw error;
  return data;
};

export const getAllPayments = async () => {
  const { data, error } = await insforge.database
    .from('payments')
    .select(`
      *,
      profiles (full_name)
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  
  return data.map((p: any) => ({
    ...p,
    full_name: Array.isArray(p.profiles) ? p.profiles[0]?.full_name : p.profiles?.full_name || 'Unknown student'
  }));
};

export const getAllMealLogs = async () => {
  const { data, error } = await insforge.database
    .from('meal_records')
    .select(`
      *,
      profiles (username, full_name)
    `)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  
  return data.map((l: any) => ({
    ...l,
    username: Array.isArray(l.profiles) ? l.profiles[0]?.full_name : l.profiles?.full_name || l.profiles?.username || 'Unknown student'
  }));
};export const broadcastNotification = async (notif: { title: string, message: string, type: string, student_id?: string }) => {
  const date = new Date().toISOString().split('T')[0];
  const { data, error } = await insforge.database
    .from('notifications')
    .insert([
      { ...notif, date }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
