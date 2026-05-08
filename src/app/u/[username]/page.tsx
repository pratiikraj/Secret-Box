import { UserProfile } from "@/components/send-message/user-profile";
import { MessageForm } from "@/components/send-message/message-form";
import dbConnection from "@/lib/dbConnection";
import UserModel from "@/model/User";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function SendMessagePage({ params }: PageProps) {
  const { username } = await params;

  await dbConnection();
  const user = await UserModel.findOne({ username, isVerify: true }).select(
    "name username image headline question isAcceptingMessages"
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-4xl font-bold text-foreground">User Not Found</h1>
          <p className="text-muted-foreground text-lg">
            The user <span className="font-semibold">@{username}</span> does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (!user.isAcceptingMessages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8 max-w-lg">
          <UserProfile
            name={user.name}
            photo={user.image}
            headline={user.headline}
          />
          <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border">
            <p className="text-muted-foreground text-lg">
              🔒 <span className="font-semibold">{user.name}</span> is not accepting messages right now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <UserProfile
          name={user.name}
          photo={user.image}
          headline={user.headline}
          question={user.question}
        />
        <MessageForm username={username} />
      </div>
    </div>
  );
}
