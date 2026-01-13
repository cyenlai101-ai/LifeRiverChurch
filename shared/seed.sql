create extension if not exists pgcrypto;

insert into public.sites (id, code, name, theme_color)
values
  ('11111111-1111-1111-1111-111111111111', 'center', '生命河中心', '#1f4ed8'),
  ('22222222-2222-2222-2222-222222222222', 'guangfu', '光復教會', '#2ba86a'),
  ('33333333-3333-3333-3333-333333333333', 'second', '第二教會', '#ff8b2c'),
  ('44444444-4444-4444-4444-444444444444', 'fuzhong', '府中教會', '#6d28d9')
on conflict (code) do nothing;

insert into public.users (id, email, password_hash, full_name, role, site_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'demo@liferiverchurch.org',
    crypt('churchriverlife', gen_salt('bf')),
    '示範帳號',
    'Member',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'staff@liferiverchurch.org',
    crypt('churchriverlife', gen_salt('bf')),
    '中心同工',
    'CenterStaff',
    '11111111-1111-1111-1111-111111111111'
  )
on conflict (id) do update
  set email = excluded.email,
      password_hash = excluded.password_hash,
      full_name = excluded.full_name,
      role = excluded.role,
      site_id = excluded.site_id,
      is_active = true;

insert into public.dashboard_summaries (user_id, data)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{
      "daily_verse": {
        "text": "凡勞苦擔重擔的人，可以到我這裡來。",
        "reference": "馬太福音 11:28"
      },
      "checkin_qr_hint": "主日/活動簽到快速通行",
      "giving_masked": "******",
      "giving_last": "最近一次：09/28 · 已入帳",
      "registrations": ["城市復興特會 · 已完成", "家庭關係工作坊 · 待付款"],
      "prayer_response_count": 2,
      "prayer_message": "2 則代禱已被回應",
      "group_name": "恩典小組",
      "group_schedule": "週五 20:00",
      "group_leader": "王小組長",
      "notifications": ["久未出席提醒已送出", "10 月禱告會邀請"],
      "recent_activity": [
        "10/02 已完成「城市復興特會」報名",
        "10/01 代禱事項已新增回應",
        "09/28 奉獻收據已寄送至 Email"
      ]
    }'
  )
on conflict (user_id) do nothing;

insert into public.weekly_verses (id, site_id, week_start, text, reference)
values (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  current_date - (extract(dow from current_date)::int),
  '凡勞苦擔重擔的人，可以到我這裡來。',
  '馬太福音 11:28'
)
on conflict (id) do nothing;

insert into public.events (id, site_id, title, description, start_at, end_at, capacity, waitlist_enabled, status, created_by)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    '城市復興特會',
    '城市中的復興與盼望。',
    '2024-10-05 19:00:00+08',
    '2024-10-05 21:30:00+08',
    500,
    true,
    'Published',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    '家庭關係工作坊',
    '夫妻溝通與家庭關係重建。',
    '2024-10-12 14:00:00+08',
    '2024-10-12 17:00:00+08',
    120,
    true,
    'Published',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    '青年敬拜之夜',
    '跨世代敬拜與分享。',
    '2024-10-19 20:00:00+08',
    '2024-10-19 22:00:00+08',
    120,
    false,
    'Published',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  )
on conflict (id) do nothing;

insert into public.event_registrations (id, event_id, user_id, status, ticket_count, is_proxy)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Confirmed',
    1,
    false
  )
on conflict (id) do nothing;

insert into public.prayer_requests (id, user_id, site_id, content, privacy_level, status, amen_count)
values
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '為家庭關係禱告，求神醫治溝通的裂縫。',
    'Public',
    'Approved',
    36
  ),
  (
    '12121212-1212-1212-1212-121212121212',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '為職場新階段禱告，願主賜智慧與平安。',
    'Group',
    'Approved',
    22
  ),
  (
    '13131313-1313-1313-1313-131313131313',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444',
    '為身體健康禱告，求主保守手術後的恢復。',
    'Public',
    'Approved',
    54
  )
on conflict (id) do nothing;

insert into public.care_subjects (id, site_id, name, subject_type, status)
values
  (
    '14141414-1414-1414-1414-141414141414',
    '11111111-1111-1111-1111-111111111111',
    '王小光',
    'Member',
    'Active'
  ),
  (
    '15151515-1515-1515-1515-151515151515',
    '11111111-1111-1111-1111-111111111111',
    '陳佳怡',
    'Member',
    'Paused'
  ),
  (
    '16161616-1616-1616-1616-161616161616',
    '44444444-4444-4444-4444-444444444444',
    '林俊哲',
    'Seeker',
    'Active'
  )
on conflict (id) do nothing;

insert into public.care_logs (id, subject_id, created_by, note, mood_score, spiritual_score)
values
  (
    '17171717-1717-1717-1717-171717171717',
    '14141414-1414-1414-1414-141414141414',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '近期壓力較大，已安排關懷禱告。',
    3,
    4
  ),
  (
    '18181818-1818-1818-1818-181818181818',
    '15151515-1515-1515-1515-151515151515',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '家庭議題需要後續跟進。',
    2,
    3
  ),
  (
    '19191919-1919-1919-1919-191919191919',
    '16161616-1616-1616-1616-161616161616',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '初次探訪，願意參加下次小組活動。',
    4,
    3
  )
on conflict (id) do nothing;
