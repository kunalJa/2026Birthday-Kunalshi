// ─── Database Schema Types (mirrors Supabase SQL exactly) ───

export interface Profile {
  id: string;
  username: string | null;
  balance: number;
  avatar_url: string | null;
  role: "guest" | "admin" | "host";
  created_at: string;
}

export interface Market {
  id: string;
  question: string;
  yes_price: number;
  no_price: number;
  is_locked: boolean;
  outcome: string | null;
}

export interface MarketPosition {
  id: string;
  user_id: string | null;
  market_id: string | null;
  outcome: string | null;
  shares_owned: number;
}

export interface Bounty {
  id: string;
  title: string | null;
  description: string | null;
  reward: number | null;
  status: "OPEN" | "CLAIMED" | "VERIFIED" | "REJECTED";
  claimer_id: string | null;
  proof_url: string | null;
}

export interface Transaction {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  amount: number | null;
  message: string | null;
  created_at: string;
  expires_at: string | null;
  location_id: string | null;
}

export interface MapLocation {
  id: string;
  name: string;
  emoji: string;
  x_pct: number;
  y_pct: number;
  phase: number;
  description: string | null;
  is_active: boolean;
}

export interface GameSetting {
  key: string;
  value: string;
  updated_at: string;
}

// ─── Supabase Database type helper ───

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          username?: string | null;
          balance?: number;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          balance?: number;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      markets: {
        Row: Market;
        Insert: {
          id?: string;
          question: string;
          yes_price?: number;
          no_price?: number;
          is_locked?: boolean;
          outcome?: string | null;
        };
        Update: {
          id?: string;
          question?: string;
          yes_price?: number;
          no_price?: number;
          is_locked?: boolean;
          outcome?: string | null;
        };
        Relationships: [];
      };
      market_positions: {
        Row: MarketPosition;
        Insert: {
          id?: string;
          user_id?: string | null;
          market_id?: string | null;
          outcome?: string | null;
          shares_owned?: number;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          market_id?: string | null;
          outcome?: string | null;
          shares_owned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "market_positions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "market_positions_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
        ];
      };
      bounties: {
        Row: Bounty;
        Insert: {
          id?: string;
          title?: string | null;
          description?: string | null;
          reward?: number | null;
          status?: string;
          claimer_id?: string | null;
          proof_url?: string | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          description?: string | null;
          reward?: number | null;
          status?: string;
          claimer_id?: string | null;
          proof_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bounties_claimer_id_fkey";
            columns: ["claimer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          amount?: number | null;
          message?: string | null;
          created_at?: string;
          expires_at?: string | null;
          location_id?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          amount?: number | null;
          message?: string | null;
          created_at?: string;
          expires_at?: string | null;
          location_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      map_locations: {
        Row: MapLocation;
        Insert: {
          id?: string;
          name: string;
          emoji?: string;
          x_pct: number;
          y_pct: number;
          phase?: number;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          emoji?: string;
          x_pct?: number;
          y_pct?: number;
          phase?: number;
          description?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      game_settings: {
        Row: GameSetting;
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
