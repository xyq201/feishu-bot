import json
import requests
from flask import Flask, request

APP_ID = "cli_aa819a2855389bc2"
APP_SECRET = "lvdmvHJEnkADJ2BOq1QwsbOQbv2QVaXz"
VERIFICATION_TOKEN = "feishu_robot_888"

def get_token():
    r = requests.post("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                      json={"app_id":APP_ID,"app_secret":APP_SECRET})
    return r.json()["tenant_access_token"]

def send_msg(chat_id,text):
    h={"Authorization":f"Bearer {get_token()}"}
    requests.post("https://open.feishu.cn/open-apis/im/v1/messages",
                  headers=h,params={"receive_id_type":"chat_id"},
                  json={"receive_id":chat_id,"msg_type":"text","content":json.dumps({"text":text})})

def mute_all(chat_id,status):
    h={"Authorization":f"Bearer {get_token()}"}
    requests.patch(f"https://open.feishu.cn/open-apis/im/v1/chats/{chat_id}/chat_settings",
                   headers=h,json={"moderation_setting":{"is_all_muted":status}})

app=Flask(__name__)

# 健康检测页面（Vercel必须要有，打开显示ok）
@app.route("/")
def index():
    return "ok"

# 飞书回调地址
@app.route("/webhook",methods=["POST"])
def webhook():
    d=request.get_json()
    # 飞书验证
    if d.get("type")=="url_verification":
        return json.dumps({"challenge":d["challenge"]})
    # 处理消息
    try:
        msg=d["event"]["message"]["content"]
        cid=d["event"]["message"]["chat_id"]
        if "开启全员禁言" in msg:
            mute_all(cid,True)
            send_msg(cid,"✅ 已开启全员禁言")
        elif "关闭全员禁言" in msg:
            mute_all(cid,False)
            send_msg(cid,"✅ 已关闭全员禁言")
    except:
        pass
    return ""

if __name__=="__main__":
    app.run(host="0.0.0.0",port=3000)
