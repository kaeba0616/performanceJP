export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name_ko: string
          name_ja: string | null
          name_en: string | null
          image_url: string | null
          instagram_url: string | null
          youtube_url: string | null
          x_url: string | null
          hit_songs: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ko: string
          name_ja?: string | null
          name_en?: string | null
          image_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          x_url?: string | null
          hit_songs?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ko?: string
          name_ja?: string | null
          name_en?: string | null
          image_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          x_url?: string | null
          hit_songs?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["artist_id"]
          }
        ]
      }
      performances: {
        Row: {
          id: string
          artist_id: string | null
          type: 'solo' | 'festival'
          title: string
          venue: string | null
          city: string | null
          start_date: string
          end_date: string | null
          start_time: string | null
          end_time: string | null
          ticket_open_at: string | null
          presale_open_at: string | null
          price_info: string | null
          status: string
          image_url: string | null
          setlist: Json | null
          show_times: Json | null
          org_id: string | null
          origin: 'crawled' | 'admin' | 'org'
          visibility: 'public' | 'unlisted' | 'private'
          summary: string | null
          poster_url: string | null
          gallery: Json | null
          cast_members: Json | null
          video_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id?: string | null
          type?: 'solo' | 'festival'
          title: string
          venue?: string | null
          city?: string | null
          start_date: string
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          status?: string
          image_url?: string | null
          setlist?: Json | null
          show_times?: Json | null
          org_id?: string | null
          origin?: 'crawled' | 'admin' | 'org'
          visibility?: 'public' | 'unlisted' | 'private'
          summary?: string | null
          poster_url?: string | null
          gallery?: Json | null
          cast_members?: Json | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string | null
          type?: 'solo' | 'festival'
          title?: string
          venue?: string | null
          city?: string | null
          start_date?: string
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          status?: string
          image_url?: string | null
          setlist?: Json | null
          show_times?: Json | null
          org_id?: string | null
          origin?: 'crawled' | 'admin' | 'org'
          visibility?: 'public' | 'unlisted' | 'private'
          summary?: string | null
          poster_url?: string | null
          gallery?: Json | null
          cast_members?: Json | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      artist_memberships: {
        Row: {
          group_id: string
          member_id: string
          display_order: number
          created_at: string
        }
        Insert: {
          group_id: string
          member_id: string
          display_order?: number
          created_at?: string
        }
        Update: {
          group_id?: string
          member_id?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      performance_artists: {
        Row: {
          performance_id: string
          artist_id: string
          display_order: number
          show_dates: string[] | null
          created_at: string
        }
        Insert: {
          performance_id: string
          artist_id: string
          display_order?: number
          show_dates?: string[] | null
          created_at?: string
        }
        Update: {
          performance_id?: string
          artist_id?: string
          display_order?: number
          show_dates?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_artists_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      source_listings: {
        Row: {
          id: string
          performance_id: string | null
          source: string
          source_url: string
          source_id: string | null
          raw_title: string
          raw_data: Json | null
          ticket_open_at: string | null
          price_info: string | null
          last_crawled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          performance_id?: string | null
          source: string
          source_url: string
          source_id?: string | null
          raw_title: string
          raw_data?: Json | null
          ticket_open_at?: string | null
          price_info?: string | null
          last_crawled_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          performance_id?: string | null
          source?: string
          source_url?: string
          source_id?: string | null
          raw_title?: string
          raw_data?: Json | null
          ticket_open_at?: string | null
          price_info?: string | null
          last_crawled_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_listings_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      web_push_subscriptions: {
        Row: {
          id: string
          subscriber_id: string | null
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          last_used_at: string
        }
        Insert: {
          id?: string
          subscriber_id?: string | null
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
          last_used_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string | null
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
          last_used_at?: string
        }
        Relationships: []
      }
      web_push_log: {
        Row: {
          id: string
          web_push_subscription_id: string
          performance_id: string | null
          type: string
          sent_at: string
        }
        Insert: {
          id?: string
          web_push_subscription_id: string
          performance_id?: string | null
          type: string
          sent_at?: string
        }
        Update: {
          id?: string
          web_push_subscription_id?: string
          performance_id?: string | null
          type?: string
          sent_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          id: string
          email: string
          verified: boolean
          verify_token: string | null
          subscribed_at: string
          unsubscribe_token: string
        }
        Insert: {
          id?: string
          email: string
          verified?: boolean
          verify_token?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Update: {
          id?: string
          email?: string
          verified?: boolean
          verify_token?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          type: string
          target_id: string | null
          notify_ticket_open: boolean
          notify_new_performance: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          type: string
          target_id?: string | null
          notify_ticket_open?: boolean
          notify_new_performance?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          type?: string
          target_id?: string | null
          notify_ticket_open?: boolean
          notify_new_performance?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          submitter_email: string
          submitter_name: string | null
          submitter_ip: string | null
          submitter_note: string | null
          artist_id: string | null
          proposed_artist_name_ko: string | null
          proposed_artist_name_ja: string | null
          proposed_artist_name_en: string | null
          title: string
          venue: string | null
          city: string | null
          start_date: string
          end_date: string | null
          ticket_open_at: string | null
          presale_open_at: string | null
          price_info: string | null
          image_url: string | null
          source_url: string | null
          status: string
          admin_note: string | null
          rejection_reason: string | null
          approved_performance_id: string | null
          created_artist_id: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          submitter_email: string
          submitter_name?: string | null
          submitter_ip?: string | null
          submitter_note?: string | null
          artist_id?: string | null
          proposed_artist_name_ko?: string | null
          proposed_artist_name_ja?: string | null
          proposed_artist_name_en?: string | null
          title: string
          venue?: string | null
          city?: string | null
          start_date: string
          end_date?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          image_url?: string | null
          source_url?: string | null
          status?: string
          admin_note?: string | null
          rejection_reason?: string | null
          approved_performance_id?: string | null
          created_artist_id?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          submitter_email?: string
          submitter_name?: string | null
          submitter_ip?: string | null
          submitter_note?: string | null
          artist_id?: string | null
          proposed_artist_name_ko?: string | null
          proposed_artist_name_ja?: string | null
          proposed_artist_name_en?: string | null
          title?: string
          venue?: string | null
          city?: string | null
          start_date?: string
          end_date?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          image_url?: string | null
          source_url?: string | null
          status?: string
          admin_note?: string | null
          rejection_reason?: string | null
          approved_performance_id?: string | null
          created_artist_id?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_approved_performance_id_fkey"
            columns: ["approved_performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_created_artist_id_fkey"
            columns: ["created_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      song_submissions: {
        Row: {
          id: string
          kind: 'setlist' | 'hit_songs'
          performance_id: string | null
          artist_id: string | null
          submitter_email: string
          submitter_name: string | null
          submitter_note: string | null
          submitter_ip: string | null
          songs: Json
          status: string
          admin_note: string | null
          rejection_reason: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          kind: 'setlist' | 'hit_songs'
          performance_id?: string | null
          artist_id?: string | null
          submitter_email: string
          submitter_name?: string | null
          submitter_note?: string | null
          submitter_ip?: string | null
          songs: Json
          status?: string
          admin_note?: string | null
          rejection_reason?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          kind?: 'setlist' | 'hit_songs'
          performance_id?: string | null
          artist_id?: string | null
          submitter_email?: string
          submitter_name?: string | null
          submitter_note?: string | null
          submitter_ip?: string | null
          songs?: Json
          status?: string
          admin_note?: string | null
          rejection_reason?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_submissions_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications_log: {
        Row: {
          id: string
          subscriber_id: string
          performance_id: string
          type: string
          sent_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          performance_id: string
          type: string
          sent_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          performance_id?: string
          type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          handle: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_attendances: {
        Row: {
          user_id: string
          performance_id: string
          attended_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          performance_id: string
          attended_at?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          performance_id?: string
          attended_at?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_attendances_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          handle: string
          name: string
          description: string | null
          logo_url: string | null
          contact: string | null
          is_verified: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          handle: string
          name: string
          description?: string | null
          logo_url?: string | null
          contact?: string | null
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          contact?: string | null
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          org_id: string
          user_id: string
          role: 'owner' | 'staff' | 'member'
          joined_at: string
        }
        Insert: {
          org_id: string
          user_id: string
          role?: 'owner' | 'staff' | 'member'
          joined_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: 'owner' | 'staff' | 'member'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      org_invites: {
        Row: {
          id: string
          org_id: string
          code: string
          role: 'owner' | 'staff' | 'member'
          expires_at: string | null
          used_at: string | null
          used_by: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          code?: string
          role?: 'owner' | 'staff' | 'member'
          expires_at?: string | null
          used_at?: string | null
          used_by?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          code?: string
          role?: 'owner' | 'staff' | 'member'
          expires_at?: string | null
          used_at?: string | null
          used_by?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      performance_shows: {
        Row: {
          id: string
          performance_id: string
          starts_at: string
          capacity: number | null
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          performance_id: string
          starts_at: string
          capacity?: number | null
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          performance_id?: string
          starts_at?: string
          capacity?: number | null
          label?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_shows_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      reservations: {
        Row: {
          id: string
          performance_id: string
          show_id: string | null
          name: string
          phone: string | null
          email: string | null
          party_size: number
          note: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
          cancel_token: string
          price: number | null
          payment_status: 'none' | 'pending' | 'paid' | 'refunded'
          submitter_ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          performance_id: string
          show_id?: string | null
          name: string
          phone?: string | null
          email?: string | null
          party_size?: number
          note?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
          cancel_token?: string
          price?: number | null
          payment_status?: 'none' | 'pending' | 'paid' | 'refunded'
          submitter_ip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          performance_id?: string
          show_id?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          party_size?: number
          note?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
          cancel_token?: string
          price?: number | null
          payment_status?: 'none' | 'pending' | 'paid' | 'refunded'
          submitter_ip?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "performance_shows"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          org_id: string
          performance_id: string | null
          title: string
          body: string
          audience: 'members' | 'reservers' | 'public'
          sent_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          performance_id?: string | null
          title: string
          body: string
          audience: 'members' | 'reservers' | 'public'
          sent_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          performance_id?: string | null
          title?: string
          body?: string
          audience?: 'members' | 'reservers' | 'public'
          sent_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      announcement_deliveries: {
        Row: {
          id: string
          announcement_id: string
          channel: 'email' | 'push'
          recipient: string
          sent_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          channel: 'email' | 'push'
          recipient: string
          sent_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          channel?: 'email' | 'push'
          recipient?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_deliveries_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          }
        ]
      }
      recruitments: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          parts: string | null
          headcount: number | null
          deadline: string | null
          status: 'open' | 'closed'
          is_public: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description?: string | null
          parts?: string | null
          headcount?: number | null
          deadline?: string | null
          status?: 'open' | 'closed'
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          description?: string | null
          parts?: string | null
          headcount?: number | null
          deadline?: string | null
          status?: 'open' | 'closed'
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          id: string
          recruitment_id: string
          name: string
          phone: string | null
          email: string | null
          part: string | null
          intro: string | null
          attachment_url: string | null
          status: 'submitted' | 'screening' | 'audition' | 'passed' | 'rejected'
          admin_note: string | null
          submitter_ip: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          recruitment_id: string
          name: string
          phone?: string | null
          email?: string | null
          part?: string | null
          intro?: string | null
          attachment_url?: string | null
          status?: 'submitted' | 'screening' | 'audition' | 'passed' | 'rejected'
          admin_note?: string | null
          submitter_ip?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          recruitment_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          part?: string | null
          intro?: string | null
          attachment_url?: string | null
          status?: 'submitted' | 'screening' | 'audition' | 'passed' | 'rejected'
          admin_note?: string | null
          submitter_ip?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_recruitment_id_fkey"
            columns: ["recruitment_id"]
            isOneToOne: false
            referencedRelation: "recruitments"
            referencedColumns: ["id"]
          }
        ]
      }
      rehearsals: {
        Row: {
          id: string
          org_id: string
          performance_id: string | null
          title: string
          starts_at: string
          ends_at: string | null
          location: string | null
          target_parts: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          performance_id?: string | null
          title: string
          starts_at: string
          ends_at?: string | null
          location?: string | null
          target_parts?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          performance_id?: string | null
          title?: string
          starts_at?: string
          ends_at?: string | null
          location?: string | null
          target_parts?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehearsals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      rehearsal_attendances: {
        Row: {
          rehearsal_id: string
          user_id: string
          status: 'going' | 'not' | 'maybe'
          updated_at: string
        }
        Insert: {
          rehearsal_id: string
          user_id: string
          status: 'going' | 'not' | 'maybe'
          updated_at?: string
        }
        Update: {
          rehearsal_id?: string
          user_id?: string
          status?: 'going' | 'not' | 'maybe'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_attendances_rehearsal_id_fkey"
            columns: ["rehearsal_id"]
            isOneToOne: false
            referencedRelation: "rehearsals"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      show_availability: {
        Row: {
          show_id: string | null
          performance_id: string | null
          capacity: number | null
          reserved: number | null
          remaining: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_shows_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      is_org_staff: {
        Args: { p_org: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
