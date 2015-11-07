from bs4 import BeautifulSoup
import json
import sqlite3
import requests
import sys


class Episode(object):
    def __init__(self):
        self.title = ''
        self.number = 0
        self.acts = []

    def tojson(self):
        return {
            'title': self.title,
            'number': self.number,
            'acts': [
                act.tojson()
                for act in self.acts
                ]
        }


class Act(object):
    def __init__(self, title):
        self.title = title
        self.para = []

    def tojson(self):
        return {
            'title': self.title,
            'para': [
                p.tojson() for p in self.para
                ]
        }


class Paragraph(object):
    def __init__(self, type, speaker, lines):
        self.type = type
        self.speaker = speaker
        self.lines = []

    def tojson(self):
        return self.__dict__


class EpisodeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Episode):
            return o.tojson()
        return json.JSONEncoder.default(self, o)


def parse_transcipt(doc):
    soup = BeautifulSoup(doc, 'html.parser')

    episode = Episode()

    num_tag = soup.find(class_='radio-episode-num')
    episode.number = num_tag.string[:-1]

    title_tag = num_tag.parent.h2.a
    episode.title = title_tag.string

    for act_tag in soup.find_all(class_='act'):
        act = Act(title=act_tag.h3.string)
        print("Title:", act.title)
        episode.acts.append(act)

        try:
            for paragraph_tag in act_tag.div.find_all('div'):
                type = paragraph_tag['class'][0]
                if paragraph_tag.h4 is not None:
                    speaker = paragraph_tag.h4.string
                else:
                    speaker = ''

                lines=[
                    {'begin': line_tag['begin'],
                     'text': line_tag.string if line_tag is not None else ''
                     }
                    for line_tag in paragraph_tag.find_all('p')
                ]

                act.para.append(Paragraph(type=type, speaker=speaker, lines = lines))
        except Exception as e:
            print(e)

        print("DONE")

    return episode


class Crawler(object):
    def __init__(self):
        self.init_db()

    def init_db(self):
        self.db_conn = sqlite3.connect("episodes.db")
        self.cursor = self.db_conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS episodes(num INTEGER UNIQUE, json TEXT)
        ''')

    def start(self, target):
        self.cursor.execute('''
            SELECT MAX(num) from episodes
        ''')
        try:
            last = self.cursor.fetchone()[0]
        except:
            last = 570

        self.process(target)

    def process(self, num):
        res = requests.get('http://www.thisamericanlife.org/radio-archives/episode/%d/transcript' % num)
        doc = res.text
        #doc = open("%d.html" % num, 'r', encoding='utf8').read()
        episode = parse_transcipt(doc)

        self.cursor.execute('''
            INSERT OR REPLACE INTO episodes (num, json) values(?,?)
        ''', (episode.number, json.dumps(episode, cls=EpisodeEncoder)))
        self.db_conn.commit()

    def done(self):
        self.db_conn.close()


c = Crawler()
c.start(int(sys.argv[1]))
c.done()
