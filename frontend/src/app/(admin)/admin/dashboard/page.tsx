import { getStudents } from "@/lib/data/students";
import { getInterests, getCategories, getLookingForOptions, getInterestsByIds } from "@/lib/data/interests";
import { getGroups } from "@/lib/data/groups";
import { getActivities } from "@/lib/data/activities";

export default async function AdminDashboardPage() {
    const [students, interests, categories, groups, activities] = await Promise.all([
        getStudents(),
        getInterests(),
        getCategories(),
        getGroups(),
        getActivities(),
    ]);

    // Popular interests
    const counts: Record<string, number> = {};
    students.forEach((s) => {
        s.interestIds.forEach((id) => {
            counts[id] = (counts[id] || 0) + 1;
        });
    });

    const interestPopularity = interests
        .map((i) => ({ ...i, count: counts[i.id] || 0 }))
        .sort((a, b) => b.count - a.count);

    // Category distribution
    const catCounts: Record<string, number> = {};
    students.forEach((s) => {
        s.interestIds.forEach((interestId) => {
            const interest = interests.find((i) => i.id === interestId);
            if (interest) {
                catCounts[interest.categoryId] = (catCounts[interest.categoryId] || 0) + 1;
            }
        });
    });

    const categoryDistribution = categories.map((c) => ({ ...c, count: catCounts[c.id] || 0 }));

    // Popular groups
    const popularGroups = [...groups].sort((a, b) => b.members.length - a.members.length).slice(0, 5);

    // Popular activities
    const popularActivities = [...activities].sort((a, b) => b.participants.length - a.participants.length).slice(0, 5);

    // Insights
    const topInterest = interestPopularity[0];
    const topGroup = popularGroups[0];
    const totalParticipants = activities.reduce((sum, a) => sum + a.participants.length, 0);
    const avgParticipation = activities.length > 0 ? Math.round(totalParticipants / activities.length) : 0;

    const insights = [
        {
            title: `${topInterest?.name || 'ไม่มีข้อมูล'} เป็น Interest ที่ได้รับความนิยมสูงสุด`,
            description: `มีนักศึกษา ${topInterest?.count || 0} คนที่สนใจ ${topInterest?.name || 'หัวข้อนี้'} อาจพิจารณาจัดกิจกรรมที่เกี่ยวข้อง`,
            type: "suggestion" as const,
            icon: "💡",
        },
        {
            title: `${topGroup?.name || 'ไม่มีกลุ่ม'} เป็นกลุ่มที่มีสมาชิกมากที่สุด`,
            description: topGroup ? `มีสมาชิก ${topGroup.members.length} คน แสดงว่ามีความสนใจในด้านนี้สูง` : `ยังไม่มีการสร้างกลุ่มในระบบ`,
            type: "info" as const,
            icon: "📊",
        },
        {
            title: `กิจกรรมมีผู้เข้าร่วมเฉลี่ย ${avgParticipation} คน`,
            description: `จากทั้งหมด ${activities.length} กิจกรรม อาจต้องโปรโมทเพิ่มเพื่อเพิ่มการมีส่วนร่วม`,
            type: "suggestion" as const,
            icon: "📈",
        },
        {
            title: `คำแนะนำการจับกลุ่ม`,
            description: `ระบบมีการอัปเดตข้อมูลจาก Maejo REG เพื่อจับคู่นักศึกษาวิทยาการคอมพิวเตอร์อย่างแม่นยำ`,
            type: "suggestion" as const,
            icon: "🎯",
        },
    ];

    const maxInterestCount = interestPopularity[0]?.count || 1;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4">
                <div>
                    <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">ภาพรวมของระบบ Interest Match</p>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-primary">
                        Live Data from PostgreSQL
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total CS Students", value: students.length, icon: "🎓", color: "bg-blue-50 text-primary border-primary/20" },
                    { label: "Total Interests", value: interests.length, icon: "✨", color: "bg-purple-50 text-primary border-primary/20" },
                    { label: "Total Groups", value: groups.length, icon: "👥", color: "bg-green-50 text-primary border-primary/20" },
                    { label: "Total Activities", value: activities.length, icon: "🎯", color: "bg-amber-50 text-amber-600 border-amber-100" },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl border p-5 ${stat.color}`}>
                        <span className="text-2xl">{stat.icon}</span>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        <p className="text-sm opacity-80">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Popular Interests */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-4">🏆 Popular Interests (Top 10)</h2>
                    <div className="space-y-3">
                        {interestPopularity.slice(0, 10).map((interest, index) => (
                            <div key={interest.id} className="flex items-center gap-3">
                                <span className="text-sm font-bold text-muted-foreground w-5">{index + 1}</span>
                                <span className="text-lg">{interest.icon}</span>
                                <span className="text-sm flex-1">{interest.name}</span>
                                <div className="w-32 bg-muted rounded-full h-2">
                                    <div
                                        className="gradient-primary rounded-full h-2"
                                        style={{ width: `${(interest.count / maxInterestCount) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold w-8 text-right">{interest.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-4">📂 Interest Categories</h2>
                    <div className="space-y-4">
                        {categoryDistribution.map((cat) => {
                            const maxCat = Math.max(...categoryDistribution.map(c => c.count)) || 1;
                            return (
                                <div key={cat.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{cat.icon} {cat.name}</span>
                                        <span className="font-semibold">{cat.count} selections</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3">
                                        <div
                                            className={`rounded-full h-3 ${cat.color.split(" ")[0]}`}
                                            style={{ width: `${(cat.count / maxCat) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Popular Groups */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-4">👥 Popular Groups</h2>
                    <div className="space-y-3">
                        {popularGroups.length === 0 && (
                            <p className="text-sm text-muted-foreground italic text-center py-4">ยังไม่มีกลุ่ม</p>
                        )}
                        {popularGroups.map((group, index) => (
                            <div key={group.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                                <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{group.name}</p>
                                </div>
                                <span className="text-sm font-semibold">{group.members.length} members</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Activities */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-4">🎯 Popular Activities</h2>
                    <div className="space-y-3">
                        {popularActivities.length === 0 && (
                            <p className="text-sm text-muted-foreground italic text-center py-4">ยังไม่มีกิจกรรม</p>
                        )}
                        {popularActivities.map((activity, index) => (
                            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                                <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground">📅 {activity.date} · 📍 {activity.location}</p>
                                </div>
                                <span className="text-sm font-semibold">{activity.participants.length}/{activity.capacity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">💡 System Insights</h2>
                <div className="space-y-3">
                    {insights.map((insight, index) => (
                        <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">{insight.icon}</span>
                                <div>
                                    <p className="text-sm font-medium">{insight.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
