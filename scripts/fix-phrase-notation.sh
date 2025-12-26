#!/bin/bash
# 英熟語の表記を一括修正するスクリプト

FILE="public/data/vocabulary/junior-high-intermediate-phrases.csv"
BACKUP="${FILE}.backup-phrase-notation"

# バックアップを作成
cp "$FILE" "$BACKUP"

# ~ を追加すべき熟語（目的語を取る熟語）
sed -i '' 's/^according to,/according to ~,/' "$FILE"
sed -i '' 's/〜によれば,according to/〜によれば,according to ~/' "$FILE"

sed -i '' 's/^agree with,/agree with ~,/' "$FILE"
sed -i '' 's/〜に同意する,agree with/〜に同意する,agree with ~/' "$FILE"

sed -i '' 's/^arrive at,/arrive at ~,/' "$FILE"
sed -i '' 's/到着する,arrive/〜に到着する,arrive/' "$FILE"

sed -i '' 's/^ask for,/ask for ~,/' "$FILE"
sed -i '' 's/〜を求める,ask/〜を求める,ask ~/' "$FILE"

sed -i '' 's/^because of,/because of ~,/' "$FILE"
sed -i '' 's/〜のために,because of/〜のために,because of ~/' "$FILE"

sed -i '' 's/^belong to,/belong to ~,/' "$FILE"
sed -i '' 's/〜に属する,belong/〜に属する,belong ~/' "$FILE"

sed -i '' 's/^come from,/come from ~,/' "$FILE"
sed -i '' 's/〜出身である・由来する,come/〜出身である・由来する,come ~/' "$FILE"

sed -i '' 's/^depend on,/depend on ~,/' "$FILE"
sed -i '' 's/頼る・次第である,depend/〜に頼る・〜次第である,depend/' "$FILE"

sed -i '' 's/^hear of,/hear of ~,/' "$FILE"
sed -i '' 's/〜について聞く,hear/〜について聞く,hear ~/' "$FILE"

sed -i '' 's/^listen to,/listen to ~,/' "$FILE"
sed -i '' 's/〜を聞く,listen/〜を聞く,listen ~/' "$FILE"

sed -i '' 's/^look at,/look at ~,/' "$FILE"
sed -i '' 's/〜を見る,look at/〜を見る,look at ~/' "$FILE"

sed -i '' 's/^look for,/look for ~,/' "$FILE"
sed -i '' 's/〜を探す,look for/〜を探す,look for ~/' "$FILE"

sed -i '' 's/^look forward to,/look forward to ~,/' "$FILE"
sed -i '' 's/〜を楽しみにする,look forward to/〜を楽しみにする,look forward to ~/' "$FILE"

sed -i '' 's/^look like,/look like ~,/' "$FILE"
sed -i '' 's/〜のように見える,look like/〜のように見える,look like ~/' "$FILE"

sed -i '' 's/^next to,/next to ~,/' "$FILE"
sed -i '' 's/〜の隣に,next/〜の隣に,next ~/' "$FILE"

sed -i '' 's/^pass by,/pass by ~,/' "$FILE"

sed -i '' 's/^sound like,/sound like ~,/' "$FILE"
sed -i '' 's/〜のように聞こえる,sound/〜のように聞こえる,sound ~/' "$FILE"

sed -i '' 's/^take care of,/take care of ~,/' "$FILE"
sed -i '' 's/〜の世話をする,take care of/〜の世話をする,take care of ~/' "$FILE"

sed -i '' 's/^take part in,/take part in ~,/' "$FILE"
sed -i '' 's/〜に参加する,take(取/〜に参加する,take ~(取/' "$FILE"

sed -i '' 's/^think of,/think of ~,/' "$FILE"
sed -i '' 's/〜を思い浮かべる,think of/〜を思い浮かべる,think of ~/' "$FILE"

sed -i '' 's/^turn into,/turn into ~,/' "$FILE"
sed -i '' 's/〜に変わる,turn/〜に変わる,turn ~/' "$FILE"

sed -i '' 's/^wait for,/wait for ~,/' "$FILE"
sed -i '' 's/〜を待つ,wait/〜を待つ,wait ~/' "$FILE"

sed -i '' 's/^work on,/work on ~,/' "$FILE"
sed -i '' 's/取り組む,work/〜に取り組む,work/' "$FILE"

sed -i '' 's/^Welcome to,/Welcome to ~,/' "$FILE"
sed -i '' 's/〜へようこそ,Welcome to で/〜へようこそ,Welcome to ~ で/' "$FILE"

sed -i '' 's/^Thanks for,/Thanks for ~,/' "$FILE"
sed -i '' 's/〜をありがとう,Thanks for で/〜をありがとう,Thanks for ~ で/' "$FILE"

echo "修正完了: $FILE"
echo "バックアップ: $BACKUP"
