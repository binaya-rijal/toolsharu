import { Metadata } from "next";
import SpriteSheetAnimator from "@/components/tools/SpriteSheetAnimator";

export const metadata: Metadata = {
    title: "Sprite Sheet Animator - ToolsHaru",
    description: "Animate sprite sheets frame by frame with ease. Upload, configure, and play your sprite animations.",
};

export default function SpriteSheetAnimatorPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Sprite Sheet Animator</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Upload your sprite sheet, define the grid, and bring your animations to life.
                    </p>
                </div>

                <SpriteSheetAnimator />
            </div>
        </div>
    );
}
