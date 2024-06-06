import { useState, useEffect } from "react";
import axios from "axios";
import { InboxType, MessageContent, UserType } from "../types";

function Inbox() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [messages, setMessages] = useState<InboxType[]>([]);
  const [contents, setContents] = useState<MessageContent[]>([]);

  const fetchUsers = async () => {
    const { data } = await axios.get(`/user`);
    setUsers(data);
  };

  const fetchMessages = async () => {
    const { data } = await axios.get("/message/getAll");
    setMessages(data);
    setContents([]);
  };
  const deleteMessage = async (_id: string) => {
    await axios.delete(`/message/${_id}`);
    fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  console.log(users);
  console.log(messages);

  return (
    <div className="flex h-screen">
      <div className="bg-gray-100 w-64">
        <div className="flex flex-row justify-between p-4 items-center">
          <div className="text-xl font-bold">Inbox</div>
          <svg
            className="flex-none w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <div className="flex justify-start font-semibold items-center p-4 space-x-1">
          <div className="text-sm">Conversations</div>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
        <div className="flex flex-col space-y-3">
          {users &&
            messages.map((message, index) => {
              const user = users.filter(
                (user) => user.email === message.sender
              )[0];
              return (
                <div
                  key={index}
                  onClick={() => setContents(message.contents)}
                  className="flex justify-between font-semibold items-center px-4 text-xs hover:bg-gray-200 cursor-pointer"
                >
                  <div className="flex space-x-3 items-center">
                    <img
                      className="rounded-full w-10 h-10 min-w-10 min-h-10 float-right"
                      src={
                        user?.photoURL ||
                        `${import.meta.env.VITE_API_BACKEND_URL}public/user.png`
                      }
                    />
                    <div>{user?.displayName || "Roman " + index}</div>
                  </div>
                  <div className="text-gray-400">{message.count}</div>
                </div>
              );
            })}

          <div className="flex justify-between font-semibold items-center px-4 text-xs text-gray-500">
            <div className="flex flex-row space-x-3 items-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              <div className="text-xs">Create view</div>
            </div>
          </div>

          <div className="flex justify-between font-semibold items-center px-4 text-xs text-gray-500">
            <div>See 0 more...</div>
            <div>Edit</div>
          </div>
        </div>
      </div>
      <div className="bg-blue-200 flex-auto px-2 overflow-y-scroll">
        {contents.map((item, index) => (
          <div
            key={index}
            className="block w-full my-2 p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <p className="font-normal text-gray-700 dark:text-gray-400">
              {item.content}
            </p>
            <div className="flex justify-between mt-3">
              <p className="font-normal text-gray-400 dark:text-gray-400 text-sm">
                {item.createdAt}
              </p>
              <div
                onClick={() => deleteMessage(item.id)}
                className="inline-flex cursor-pointer items-center px-2 py-1 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Delete
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Inbox;
