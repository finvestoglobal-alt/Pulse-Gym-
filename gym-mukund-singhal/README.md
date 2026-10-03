# Mukund Singhal Gym — Staff Management Dashboard

Private staff-only gym management system for **Mukund Singhal Gym** (Strength • Health • Community).
Built with Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, and Supabase.

## Getting Started Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   Verify your `.env.local` contains your gym's Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://cgrxbowtfbwsbgytmmnv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iTdb8pqYfsKFZ66cK4RdyA__G1V1rEr
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view your gym dashboard.

## Production Build & Deployment

### Vercel (Recommended)
1. Push this repository to GitHub or GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Self-Hosted / Node.js
```bash
npm run build
npm start
```
